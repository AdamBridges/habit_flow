document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");

  if (!form) {
    return;
  }

  const status = document.getElementById("contact-status");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const subjectInput = document.getElementById("subject");
  const messageInput = document.getElementById("message");
  const nameError = document.getElementById("name-error");
  const emailError = document.getElementById("email-error");
  const subjectError = document.getElementById("subject-error");
  const messageError = document.getElementById("message-error");

  if (
    !status ||
    !nameInput ||
    !emailInput ||
    !subjectInput ||
    !messageInput ||
    !nameError ||
    !emailError ||
    !subjectError ||
    !messageError
  ) {
    return;
  }

  const fieldRules = [
    {
      input: nameInput,
      error: nameError,
      emptyMessage: "Please enter your name.",
    },
    {
      input: emailInput,
      error: emailError,
      emptyMessage: "Please enter your email address.",
      isValid: isValidEmail,
      invalidMessage: EMAIL_ERROR_MESSAGE,
    },
    {
      input: subjectInput,
      error: subjectError,
      emptyMessage: "Please select a subject.",
    },
    {
      input: messageInput,
      error: messageError,
      emptyMessage: "Please enter a message.",
    },
  ];

  form.noValidate = true;

  function hideStatus() {
    status.textContent = "";
    status.hidden = true;
  }

  function validateField(rule) {
    const value = rule.input.value.trim();
    let errorMessage = "";

    if (!value) {
      errorMessage = rule.emptyMessage;
    } else if (rule.isValid && !rule.isValid(value)) {
      errorMessage = rule.invalidMessage;
    }

    rule.error.textContent = errorMessage;

    if (errorMessage) {
      rule.input.setAttribute("aria-invalid", "true");
    } else {
      rule.input.removeAttribute("aria-invalid");
    }

    return !errorMessage;
  }

  function clearValidation() {
    fieldRules.forEach((rule) => {
      rule.error.textContent = "";
      rule.input.removeAttribute("aria-invalid");
    });
    hideStatus();
  }

  fieldRules.forEach((rule) => {
    rule.input.addEventListener("blur", () => validateField(rule));
    rule.input.addEventListener("input", () => {
      hideStatus();
      if (rule.input.getAttribute("aria-invalid") === "true") {
        validateField(rule);
      }
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    hideStatus();

    let firstInvalidInput = null;

    fieldRules.forEach((rule) => {
      if (!validateField(rule) && !firstInvalidInput) {
        firstInvalidInput = rule.input;
      }
    });

    if (firstInvalidInput) {
      firstInvalidInput.focus();
      return;
    }

    form.reset();
    clearValidation();
    status.textContent = EMAIL_SUCCESS_MESSAGE;
    status.hidden = false;
  });

  form.addEventListener("reset", clearValidation);
});
