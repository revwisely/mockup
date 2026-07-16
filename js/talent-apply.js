/* ==========================================================
   TALENT APPLICATION — Form interactions & submission
   ========================================================== */
(function () {
  'use strict';

  // --- Checkbox toggle styling ---
  var checkboxItems = document.querySelectorAll('.checkbox-item');
  for (var i = 0; i < checkboxItems.length; i++) {
    checkboxItems[i].addEventListener('change', function () {
      var cb = this.querySelector('input[type="checkbox"]');
      if (cb.checked) {
        this.classList.add('checked');
      } else {
        this.classList.remove('checked');
      }
    });
  }

  // --- File upload display ---
  var fileInput = document.getElementById('resume');
  var fileUpload = document.getElementById('file-upload');
  var fileText = document.getElementById('file-upload-text');

  if (fileInput) {
    fileInput.addEventListener('change', function () {
      if (this.files && this.files.length > 0) {
        var file = this.files[0];
        var sizeMB = (file.size / 1024 / 1024).toFixed(1);
        fileText.textContent = file.name + ' (' + sizeMB + ' MB)';
        fileUpload.classList.add('has-file');
      } else {
        fileText.textContent = 'Drag and drop or click to upload';
        fileUpload.classList.remove('has-file');
      }
    });
  }

  // --- Form submission ---
  var form = document.getElementById('consultant-form');
  var submitBtn = document.getElementById('submit-btn');
  var successEl = document.getElementById('form-success');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Validate required fields
      var requiredFields = form.querySelectorAll('[required]');
      var valid = true;

      for (var j = 0; j < requiredFields.length; j++) {
        var field = requiredFields[j];
        // Reset style
        field.style.borderColor = '';

        if (!field.value.trim()) {
          field.style.borderColor = 'var(--accent-coral)';
          valid = false;
        }
      }

      // Validate at least one expertise checkbox
      var expertiseChecked = form.querySelectorAll('input[name="expertise"]:checked');
      if (expertiseChecked.length === 0) {
        valid = false;
        var grid = document.getElementById('expertise-grid');
        if (grid) grid.style.outline = '1px solid var(--accent-coral)';
        setTimeout(function () { grid.style.outline = ''; }, 3000);
      }

      if (!valid) {
        // Scroll to first invalid field
        var firstInvalid = form.querySelector('[style*="accent-coral"]');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstInvalid.focus();
        }
        return;
      }

      // Disable button
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span style="opacity:0.7">Submitting...</span>';

      // Collect form data
      var formData = new FormData(form);

      // Track submission
      if (typeof gtag === 'function') {
        gtag('event', 'consultant_profile_submitted', {
          profile_type: formData.get('profile_type'),
          years_experience: formData.get('years_experience')
        });
      }

      // TODO: Replace with your form endpoint (Formspree, HubSpot, custom API, etc.)
      // Example with Formspree:
      // fetch('https://formspree.io/f/YOUR_FORM_ID', {
      //   method: 'POST',
      //   body: formData,
      //   headers: { 'Accept': 'application/json' }
      // })

      // For now, simulate success after a brief delay
      setTimeout(function () {
        form.style.display = 'none';
        successEl.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 800);
    });
  }
})();
