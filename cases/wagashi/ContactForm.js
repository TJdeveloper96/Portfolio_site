const form = document.querySelector(".contact-form");
const formMessage = document.querySelector(".form-message");

form.addEventListener("submit", function (event) {
  event.preventDefault();

  formMessage.textContent = "We hebben je bericht ontvangen en komen zo snel mogelijk bij je terug. Bedankt voor je bericht! Check je e-mail over een paar minuten voor onze reactie.";
  form.reset();
});
