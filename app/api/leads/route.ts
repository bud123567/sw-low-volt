import { env } from 'cloudflare:workers';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_REQUEST_SIZE = 12 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 8;

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain; charset=utf-8',
};

const FIELD_LIMITS: Record<string, number> = {
  kind: 16,
  website: 200,
  name: 120,
  contactName: 120,
  company: 120,
  email: 254,
  phone: 24,
  projectName: 160,
  bidDueDate: 80,
  projectLocation: 200,
  projectAddress: 200,
  workType: 80,
  details: 6000,
  scopeDetails: 6000,
  preferredContact: 16,
};

const QUOTE_FIELDS = new Set([
  'kind',
  'website',
  'name',
  'company',
  'email',
  'phone',
  'projectAddress',
  'workType',
  'details',
  'preferredContact',
]);

const BID_FIELDS = new Set([
  'kind',
  'website',
  'company',
  'contactName',
  'email',
  'phone',
  'projectName',
  'bidDueDate',
  'projectLocation',
  'scopeDetails',
  'plans',
]);

const CREATE_LEADS_TABLE = `
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('quote', 'bid')),
    name TEXT NOT NULL,
    company TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    project_name TEXT NOT NULL DEFAULT '',
    bid_due_date TEXT NOT NULL DEFAULT '',
    project_location TEXT NOT NULL DEFAULT '',
    project_address TEXT NOT NULL DEFAULT '',
    work_type TEXT NOT NULL DEFAULT '',
    details TEXT NOT NULL,
    preferred_contact TEXT NOT NULL DEFAULT 'either',
    file_key TEXT,
    file_name TEXT,
    file_type TEXT,
    file_size INTEGER,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`;

const CREATE_RATE_LIMITS_TABLE = `
  CREATE TABLE IF NOT EXISTS lead_rate_limits (
    key TEXT NOT NULL,
    window_start INTEGER NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (key, window_start)
  )
`;

class BodyTooLargeError extends Error {}

function response(
  body: Record<string, unknown>,
  status = 200,
  extraHeaders: HeadersInit = {},
) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...Object.fromEntries(new Headers(extraHeaders)),
    },
  });
}

function successResponse(request: Request, id: string) {
  if (request.headers.get('accept')?.includes('application/json')) {
    return response({ id }, 201);
  }

  return Response.redirect(new URL('/thanks.html', request.url), 303);
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function safeFileName(fileName: string) {
  return (
    fileName
      .normalize('NFKC')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 120) || 'project-file'
  );
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function validPhone(value: string) {
  const digitCount = value.replace(/\D/g, '').length;
  return (
    /^[0-9+().\-\s]{7,24}$/.test(value) && digitCount >= 7 && digitCount <= 15
  );
}

function containsAscii(bytes: Uint8Array, value: string) {
  const target = new TextEncoder().encode(value);
  outer: for (
    let start = 0;
    start <= bytes.length - target.length;
    start += 1
  ) {
    for (let offset = 0; offset < target.length; offset += 1) {
      if (bytes[start + offset] !== target[offset]) continue outer;
    }
    return true;
  }
  return false;
}

function fileSignatureIsValid(extension: string, bytes: Uint8Array) {
  if (extension === 'pdf') {
    return String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
  }

  if (extension === 'docx' || extension === 'xlsx') {
    const isZip =
      bytes[0] === 0x50 &&
      bytes[1] === 0x4b &&
      bytes[2] === 0x03 &&
      bytes[3] === 0x04;
    const expectedDirectory = extension === 'docx' ? 'word/' : 'xl/';
    return (
      isZip &&
      containsAscii(bytes, '[Content_Types].xml') &&
      containsAscii(bytes, expectedDirectory)
    );
  }

  if (extension === 'doc' || extension === 'xls') {
    const oleHeader = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
    return oleHeader.every((value, index) => bytes[index] === value);
  }

  if (extension === 'txt') {
    return !bytes.slice(0, 512).includes(0);
  }

  return false;
}

async function formDataWithinLimit(request: Request) {
  const contentType = request.headers.get('content-type') || '';
  if (
    !contentType.startsWith('multipart/form-data') &&
    !contentType.startsWith('application/x-www-form-urlencoded')
  ) {
    throw new TypeError('Unsupported form encoding');
  }

  if (!request.body) throw new TypeError('Missing request body');

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_REQUEST_SIZE) {
      await reader.cancel();
      throw new BodyTooLargeError();
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new Request(request.url, {
    method: 'POST',
    headers: { 'content-type': contentType },
    body,
  }).formData();
}

function formShapeIsValid(formData: FormData, allowedFields: Set<string>) {
  for (const key of new Set(formData.keys())) {
    if (!allowedFields.has(key) || formData.getAll(key).length !== 1)
      return false;
    const value = formData.get(key);
    if (
      typeof value === 'string' &&
      (FIELD_LIMITS[key] === undefined ||
        value.trim().length > FIELD_LIMITS[key])
    ) {
      return false;
    }
  }
  return true;
}

function sameOriginRequest(request: Request) {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && !['same-origin', 'none'].includes(fetchSite)) return false;

  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

async function rateLimitKey(request: Request) {
  const source =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'local-development';
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(source),
  );
  return Array.from(new Uint8Array(digest).slice(0, 16), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

async function rateLimitExceeded(request: Request) {
  await env.DB.prepare(CREATE_RATE_LIMITS_TABLE).run();
  const key = await rateLimitKey(request);
  const windowStart =
    Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
  const result = await env.DB.prepare(
    `INSERT INTO lead_rate_limits (key, window_start, count)
     VALUES (?, ?, 1)
     ON CONFLICT (key, window_start) DO UPDATE SET count = count + 1
     RETURNING count`,
  )
    .bind(key, windowStart)
    .first<{ count: number }>();
  return (result?.count || RATE_LIMIT_MAX + 1) > RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) {
    return response(
      { error: 'This form must be submitted from the SW Low Volt website.' },
      403,
    );
  }

  const declaredSize = Number(request.headers.get('content-length') || '0');
  if (Number.isFinite(declaredSize) && declaredSize > MAX_REQUEST_SIZE) {
    return response(
      { error: 'The request is larger than the 12 MB limit.' },
      413,
    );
  }

  let formData: FormData;
  try {
    formData = await formDataWithinLimit(request);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return response(
        { error: 'The request is larger than the 12 MB limit.' },
        413,
      );
    }
    return response({ error: 'The submitted form could not be read.' }, 400);
  }

  if (formData.getAll('kind').length !== 1) {
    return response({ error: 'Choose a valid request type.' }, 400);
  }

  const kind = readText(formData, 'kind');
  if (kind !== 'quote' && kind !== 'bid') {
    return response({ error: 'Choose a valid request type.' }, 400);
  }

  if (
    !formShapeIsValid(formData, kind === 'quote' ? QUOTE_FIELDS : BID_FIELDS)
  ) {
    return response(
      { error: 'The submitted form contains invalid or oversized fields.' },
      400,
    );
  }

  if (readText(formData, 'website')) {
    return successResponse(request, crypto.randomUUID());
  }

  try {
    if (await rateLimitExceeded(request)) {
      return response(
        {
          error:
            'Too many requests were sent from this connection. Please call us directly.',
        },
        429,
        { 'Retry-After': String(RATE_LIMIT_WINDOW_MS / 1000) },
      );
    }
  } catch {
    return response(
      {
        error:
          'The request service is temporarily unavailable. Please call us directly.',
      },
      503,
    );
  }

  const id = crypto.randomUUID();
  const name = readText(formData, kind === 'bid' ? 'contactName' : 'name');
  const company = readText(formData, 'company');
  const email = readText(formData, 'email').toLowerCase();
  const phone = readText(formData, 'phone');
  const projectName = readText(formData, 'projectName');
  const bidDueDate = readText(formData, 'bidDueDate');
  const projectLocation = readText(formData, 'projectLocation');
  const projectAddress = readText(formData, 'projectAddress');
  const workType = readText(formData, 'workType');
  const details = readText(
    formData,
    kind === 'bid' ? 'scopeDetails' : 'details',
  );
  const preferredContact =
    kind === 'quote' ? readText(formData, 'preferredContact') : 'either';

  if (!name || !validEmail(email) || !validPhone(phone)) {
    return response(
      { error: 'Enter a valid name, email address, and phone number.' },
      400,
    );
  }

  if (kind === 'quote') {
    if (projectAddress.length < 4 || !workType || details.length < 20) {
      return response(
        { error: 'Add the project location, type of work, and scope details.' },
        400,
      );
    }
    if (!['phone', 'email', 'either'].includes(preferredContact)) {
      return response({ error: 'Choose a valid contact preference.' }, 400);
    }
  }

  if (
    kind === 'bid' &&
    (company.length < 2 ||
      projectName.length < 2 ||
      projectLocation.length < 4 ||
      details.length < 20)
  ) {
    return response(
      {
        error:
          'Add the company, project name, project location, and scope details.',
      },
      400,
    );
  }

  let fileKey: string | null = null;
  let fileName: string | null = null;
  let fileType: string | null = null;
  let fileSize: number | null = null;
  let fileBytes: Uint8Array | null = null;
  const upload = formData.get('plans');

  if (upload && typeof upload !== 'string' && upload.size > 0) {
    if (kind !== 'bid') {
      return response(
        { error: 'Files can only be attached to bid invitations.' },
        400,
      );
    }
    if (upload.size > MAX_FILE_SIZE) {
      return response(
        { error: 'The selected file is larger than 10 MB.' },
        413,
      );
    }

    const extension = upload.name.split('.').pop()?.toLowerCase() || '';
    if (!MIME_TYPES[extension]) {
      return response(
        { error: 'Choose a PDF, DOC, DOCX, XLS, XLSX, or TXT file.' },
        415,
      );
    }

    fileBytes = new Uint8Array(await upload.arrayBuffer());
    if (!fileSignatureIsValid(extension, fileBytes)) {
      return response(
        { error: 'The selected file does not match its file type.' },
        415,
      );
    }

    fileName = safeFileName(upload.name);
    fileType = MIME_TYPES[extension];
    fileSize = upload.size;
    const month = new Date().toISOString().slice(0, 7);
    fileKey = `lead-files/${month}/${id}/${fileName}`;
  }

  try {
    await env.DB.prepare(CREATE_LEADS_TABLE).run();
    await env.DB.prepare(
      `INSERT INTO leads (
        id, kind, name, company, email, phone, project_name, bid_due_date,
        project_location, project_address, work_type, details, preferred_contact,
        file_key, file_name, file_type, file_size, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        kind,
        name,
        company,
        email,
        phone,
        projectName,
        bidDueDate,
        projectLocation,
        projectAddress,
        workType,
        details,
        preferredContact,
        fileKey,
        fileName,
        fileType,
        fileSize,
        fileKey ? 'pending_upload' : 'new',
      )
      .run();
  } catch (error) {
    console.error('lead_storage_failed', {
      requestId: id,
      stage: 'database_insert',
      error,
    });
    return response(
      {
        error:
          'The request could not be saved. Please try again or call us directly.',
      },
      500,
    );
  }

  if (fileKey && fileName && fileType && fileBytes) {
    try {
      await env.FILES.put(fileKey, fileBytes, {
        httpMetadata: {
          contentType: fileType,
          contentDisposition: `attachment; filename="${fileName}"`,
        },
        customMetadata: { leadId: id, originalName: fileName },
      });
      await env.DB.prepare(`UPDATE leads SET status = 'new' WHERE id = ?`)
        .bind(id)
        .run();
    } catch (error) {
      console.error('lead_storage_failed', {
        requestId: id,
        stage: 'file_upload',
        error,
      });
      await Promise.allSettled([
        env.FILES.delete(fileKey),
        env.DB.prepare('DELETE FROM leads WHERE id = ?').bind(id).run(),
      ]);
      return response(
        {
          error:
            'The project file could not be saved. Please try again or call us directly.',
        },
        500,
      );
    }
  }

  return successResponse(request, id);
}
