// The Contact links on every page. Change this one value when the contact email changes.
(function () {
  var CONTACT_EMAIL = "devingodsson@gmail.com";
  document.querySelectorAll("[data-contact-link]").forEach(function (link) {
    link.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent("Wodblok");
  });
})();
