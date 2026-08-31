(function () {
  'use strict';

  const menuButton = document.querySelector('[data-menu-button]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  function closeMenu(restoreFocus) {
    if (!menuButton || !mobileNav) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    menuButton.textContent = '☰';
    mobileNav.classList.remove('is-open');
    mobileNav.hidden = true;
    document.body.classList.remove('nav-open');
    if (restoreFocus) menuButton.focus();
  }

  function openMenu() {
    if (!menuButton || !mobileNav) return;
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Close navigation');
    menuButton.textContent = '×';
    mobileNav.hidden = false;
    mobileNav.classList.add('is-open');
    document.body.classList.add('nav-open');
    const firstLink = mobileNav.querySelector('a');
    if (firstLink instanceof HTMLElement) firstLink.focus();
  }

  if (menuButton && mobileNav) {
    mobileNav.hidden = true;
    menuButton.addEventListener('click', function () {
      const expanded = menuButton.getAttribute('aria-expanded') === 'true';
      if (expanded) closeMenu(false);
      else openMenu();
    });

    mobileNav.addEventListener('click', function (event) {
      if (event.target instanceof HTMLAnchorElement) closeMenu(false);
    });

    document.addEventListener('keydown', function (event) {
      if (
        event.key === 'Escape' &&
        menuButton.getAttribute('aria-expanded') === 'true'
      ) {
        closeMenu(true);
      }
    });

    window.addEventListener('resize', function () {
      if (window.matchMedia('(min-width: 1181px)').matches) closeMenu(false);
    });
  }

  const acceptedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];
  const maxFileSize = 10 * 1024 * 1024;

  function extensionFor(fileName) {
    const parts = fileName.toLowerCase().split('.');
    return parts.length > 1 ? parts.pop() : '';
  }

  function fileError(file) {
    if (!file) return '';
    if (!acceptedExtensions.includes(extensionFor(file.name))) {
      return 'Choose a PDF, DOC, DOCX, XLS, XLSX, or TXT file.';
    }
    if (file.size === 0) return 'The selected file is empty.';
    if (file.size > maxFileSize)
      return 'The selected file is larger than 10 MB.';
    return '';
  }

  function findControl(form, name) {
    return form.elements.namedItem(name);
  }

  function setFieldError(form, name, message) {
    const error = form.querySelector('[data-error-for="' + name + '"]');
    const control = findControl(form, name);
    const visibleControl =
      name === 'plans' ? form.querySelector('[data-upload-zone]') : null;
    if (error) error.textContent = message;

    if (control instanceof RadioNodeList) {
      Array.from(control).forEach(function (item) {
        if (item instanceof HTMLElement)
          item.setAttribute('aria-invalid', message ? 'true' : 'false');
      });
    } else if (control instanceof HTMLElement) {
      control.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    if (visibleControl instanceof HTMLElement) {
      visibleControl.setAttribute('aria-invalid', message ? 'true' : 'false');
    }
  }

  function valueOf(form, name) {
    const control = findControl(form, name);
    if (control instanceof RadioNodeList) return control.value.trim();
    if (
      control instanceof HTMLInputElement ||
      control instanceof HTMLTextAreaElement ||
      control instanceof HTMLSelectElement
    ) {
      return control.value.trim();
    }
    return '';
  }

  function validateForm(form) {
    const kind = form.dataset.kind;
    const rules =
      kind === 'bid'
        ? [
            ['company', 'Enter the company name.', 2],
            ['contactName', 'Enter the contact name.', 2],
            ['email', 'Enter a valid email address.', 3],
            ['phone', 'Enter a valid phone number.', 7],
            ['projectName', 'Enter the project name.', 2],
            ['projectLocation', 'Enter the project location.', 4],
            [
              'scopeDetails',
              'Add enough scope detail for an initial review.',
              20,
            ],
          ]
        : [
            ['name', 'Enter your name.', 2],
            ['phone', 'Enter a valid phone number.', 7],
            ['email', 'Enter a valid email address.', 3],
            [
              'projectAddress',
              'Enter the project address or general location.',
              4,
            ],
            ['workType', 'Choose the type of work.', 1],
            [
              'details',
              'Add a few more details so we can understand the scope.',
              20,
            ],
            ['preferredContact', 'Choose a preferred contact method.', 1],
          ];

    let firstInvalid = null;
    rules.forEach(function (rule) {
      const name = rule[0];
      const message = rule[1];
      const minLength = rule[2];
      const value = valueOf(form, name);
      let error = value.length < minLength ? message : '';

      if (
        !error &&
        name === 'email' &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        error = message;
      }
      if (!error && name === 'phone') {
        const digitCount = value.replace(/\D/g, '').length;
        if (
          !/^[0-9+().\-\s]{7,24}$/.test(value) ||
          digitCount < 7 ||
          digitCount > 15
        ) {
          error = message;
        }
      }

      setFieldError(form, name, error);
      if (error && !firstInvalid) firstInvalid = findControl(form, name);
    });

    const fileInput = form.querySelector('[data-file-input]');
    if (
      fileInput instanceof HTMLInputElement &&
      fileInput.files &&
      fileInput.files[0]
    ) {
      const error = fileError(fileInput.files[0]);
      setFieldError(form, 'plans', error);
      if (error && !firstInvalid) firstInvalid = fileInput;
    }

    if (firstInvalid instanceof RadioNodeList) {
      const firstRadio = Array.from(firstInvalid).find(function (item) {
        return item instanceof HTMLElement;
      });
      if (firstRadio instanceof HTMLElement) firstRadio.focus();
    } else if (firstInvalid instanceof HTMLElement) {
      firstInvalid.focus();
    }

    return !firstInvalid;
  }

  function setStatus(form, message) {
    const status = form.querySelector('[data-form-status]');
    if (!status) return;
    status.replaceChildren();
    if (!message) {
      status.classList.remove('is-visible');
      return;
    }

    status.append(document.createTextNode(message + ' You can also call '));
    const callLink = document.createElement('a');
    callLink.href = 'tel:+14435919207';
    callLink.textContent = '443-591-9207';
    status.append(callLink, document.createTextNode('.'));
    status.classList.add('is-visible');
  }

  function setProgress(form, value) {
    const wrap = form.querySelector('[data-progress-wrap]');
    const bar = form.querySelector('[data-progress-bar]');
    const text = form.querySelector('[data-progress-text]');
    if (!wrap || !bar || !text) return;
    const safeValue = Math.max(0, Math.min(100, value));
    wrap.classList.add('is-visible');
    wrap.setAttribute('aria-valuenow', String(safeValue));
    bar.style.width = Math.max(safeValue, 5) + '%';
    text.textContent = safeValue + '%';
  }

  function resetProgress(form) {
    const wrap = form.querySelector('[data-progress-wrap]');
    const bar = form.querySelector('[data-progress-bar]');
    const text = form.querySelector('[data-progress-text]');
    if (!wrap || !bar || !text) return;
    wrap.classList.remove('is-visible');
    wrap.setAttribute('aria-valuenow', '0');
    bar.style.width = '0%';
    text.textContent = '0%';
  }

  function setSending(form, sending) {
    const submit = form.querySelector('[data-submit]');
    const cancel = form.querySelector('[data-cancel]');
    if (submit instanceof HTMLButtonElement) {
      submit.disabled = sending;
      submit.dataset.originalLabel =
        submit.dataset.originalLabel || submit.textContent.trim();
      submit.textContent = sending
        ? 'Sending request…'
        : submit.dataset.originalLabel;
    }
    if (cancel instanceof HTMLButtonElement) cancel.hidden = !sending;
  }

  function resetUpload(form) {
    const input = form.querySelector('[data-file-input]');
    const chip = form.querySelector('[data-file-chip]');
    if (input instanceof HTMLInputElement) input.value = '';
    if (chip) chip.classList.remove('is-visible');
    setFieldError(form, 'plans', '');
  }

  document
    .querySelectorAll('[data-upload-form]')
    .forEach(function (formElement) {
      if (!(formElement instanceof HTMLFormElement)) return;
      const input = formElement.querySelector('[data-file-input]');
      const zone = formElement.querySelector('[data-upload-zone]');
      const chip = formElement.querySelector('[data-file-chip]');
      const fileName = formElement.querySelector('[data-file-name]');
      const fileSize = formElement.querySelector('[data-file-size]');
      const remove = formElement.querySelector('[data-file-remove]');

      function showFile(file) {
        const error = fileError(file);
        if (error) {
          resetUpload(formElement);
          setFieldError(formElement, 'plans', error);
          return;
        }
        setFieldError(formElement, 'plans', '');
        if (fileName) fileName.textContent = file.name;
        if (fileSize)
          fileSize.textContent =
            (file.size / 1024 / 1024).toFixed(2) + ' MB selected';
        if (chip) chip.classList.add('is-visible');
      }

      if (input instanceof HTMLInputElement) {
        input.addEventListener('change', function () {
          if (input.files && input.files[0]) showFile(input.files[0]);
        });
      }

      if (
        zone instanceof HTMLButtonElement &&
        input instanceof HTMLInputElement
      ) {
        zone.addEventListener('click', function () {
          input.click();
        });
        zone.addEventListener('dragover', function (event) {
          event.preventDefault();
          zone.classList.add('is-dragging');
        });
        zone.addEventListener('dragleave', function () {
          zone.classList.remove('is-dragging');
        });
        zone.addEventListener('drop', function (event) {
          event.preventDefault();
          zone.classList.remove('is-dragging');
          const file = event.dataTransfer && event.dataTransfer.files[0];
          if (!file) return;
          if (typeof DataTransfer === 'undefined') {
            setFieldError(
              formElement,
              'plans',
              'Use the choose-file control in this browser.',
            );
            return;
          }
          const transfer = new DataTransfer();
          transfer.items.add(file);
          input.files = transfer.files;
          showFile(file);
        });
      }

      if (remove instanceof HTMLButtonElement) {
        remove.addEventListener('click', function () {
          resetUpload(formElement);
          if (zone instanceof HTMLElement) zone.focus();
        });
      }
    });

  document.querySelectorAll('[data-lead-form]').forEach(function (formElement) {
    if (!(formElement instanceof HTMLFormElement)) return;
    let activeRequest = null;
    const cancel = formElement.querySelector('[data-cancel]');
    const resetButton = formElement.querySelector('[data-reset-form]');

    formElement.addEventListener('submit', function (event) {
      event.preventDefault();
      setStatus(formElement, '');
      if (!validateForm(formElement) || activeRequest) return;

      const request = new XMLHttpRequest();
      activeRequest = request;
      setSending(formElement, true);
      setProgress(formElement, 4);

      request.upload.addEventListener('progress', function (progressEvent) {
        if (progressEvent.lengthComputable) {
          setProgress(
            formElement,
            Math.round((progressEvent.loaded / progressEvent.total) * 100),
          );
        }
      });

      request.addEventListener('load', function () {
        activeRequest = null;
        setSending(formElement, false);
        let payload = {};
        try {
          payload = JSON.parse(request.responseText);
        } catch {
          payload = {};
        }

        if (request.status >= 200 && request.status < 300 && payload.id) {
          setProgress(formElement, 100);
          formElement.reset();
          resetUpload(formElement);
          formElement.classList.add('is-success');
          const success = formElement.querySelector('[data-success-panel]');
          if (success instanceof HTMLElement) success.focus();
          return;
        }

        const message =
          typeof payload.error === 'string'
            ? payload.error
            : 'The request could not be sent.';
        resetProgress(formElement);
        setStatus(formElement, message);
      });

      request.addEventListener('error', function () {
        activeRequest = null;
        setSending(formElement, false);
        resetProgress(formElement);
        setStatus(formElement, 'The network connection was interrupted.');
      });

      request.addEventListener('abort', function () {
        activeRequest = null;
        setSending(formElement, false);
        resetProgress(formElement);
        setStatus(
          formElement,
          'Sending was cancelled. Your form details are still here.',
        );
      });

      request.open('POST', '/api/leads');
      request.setRequestHeader('Accept', 'application/json');
      request.send(new FormData(formElement));
    });

    if (cancel instanceof HTMLButtonElement) {
      cancel.hidden = true;
      cancel.addEventListener('click', function () {
        if (activeRequest) activeRequest.abort();
      });
    }

    if (resetButton instanceof HTMLButtonElement) {
      resetButton.addEventListener('click', function () {
        formElement.classList.remove('is-success');
        resetProgress(formElement);
        setStatus(formElement, '');
        formElement
          .querySelectorAll('[data-error-for]')
          .forEach(function (errorElement) {
            const name = errorElement.getAttribute('data-error-for');
            if (name) setFieldError(formElement, name, '');
          });
        const firstField = formElement.querySelector(
          'input:not([type="hidden"]):not([name="website"]):not([type="file"]), select, textarea',
        );
        if (firstField instanceof HTMLElement) firstField.focus();
      });
    }
  });
})();
