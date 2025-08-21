console.log("!!!!Script loaded!!!!");

(function ($) {
    let currentStep = 0;
    const steps = $('.step');
    const progressBar = $('#progressBar');
    const prevBtn = $('#prevBtn');
    const nextBtn = $('#nextBtn');
    const costDisplay = $('#cost-display');

    // Data object to store all user selections and information
    const estimatorData = {
        websiteType: { value: null, cost: 0 },
        pageCount: { value: null, cost: 0 },
        additionalServices: [],
        additionalFeatures: [],
        totalCost: 0,
        clientInfo: {}
    };

    // Saves the current state of estimatorData to the browser's LocalStorage
    const saveToLocalStorage = () => {
        localStorage.setItem('estimatorData', JSON.stringify(estimatorData));
    };

    // Recalculates the total cost based on current selections and updates the display
    const calculateTotal = () => {
        let total = (estimatorData.websiteType.cost || 0) + (estimatorData.pageCount.cost || 0);
        estimatorData.additionalServices.forEach(service => total += service.cost);
        estimatorData.additionalFeatures.forEach(feature => total += feature.cost);

        estimatorData.totalCost = total;

        //testttt
        console.log("Website Type Cost:", estimatorData.websiteType.cost || 0);
        console.log("Page Count Cost:", estimatorData.pageCount.cost || 0);
        console.log("Additional Services:", estimatorData.additionalServices);
        console.log("Additional Features:", estimatorData.additionalFeatures);
        console.log("Total Estimated Cost:", total);

        $('#totalCost').text(`₹${total.toLocaleString('en-IN')}`);
        saveToLocalStorage();
    };

    // Updates the entire UI based on the current step
    const updateUI = () => {
        steps.removeClass('active').eq(currentStep).addClass('active');

        const progressPercentage = currentStep > 0 ? (currentStep / (steps.length - 2)) * 100 : 0;
        progressBar.css('width', `${progressPercentage}%`).attr('aria-valuenow', progressPercentage);

        // Control visibility of navigation buttons and cost display
        prevBtn.toggleClass('d-none', currentStep === 0 || currentStep === steps.length - 1);
        nextBtn.toggleClass('d-none', currentStep === 0 || currentStep >= steps.length - 2);
        costDisplay.toggleClass('d-none', currentStep === 0 || currentStep >= 3);

        // Special handling for the summary step to show the Next button
        if (currentStep === 3) {
            generateSummary();
            nextBtn.removeClass('d-none');
        }
        // Special handling for the form step
        if (currentStep === 4) {
            generateFormSummary();
        }
    };

    // Functions to navigate between steps
    window.nextStep = function () {
        if (currentStep < steps.length - 1) {
            currentStep++;
            console.log("Next step:", currentStep);
            updateUI();
        }
    };
    window.prevStep = function () {
        if (currentStep > 0) {
            currentStep--;
            console.log("Previous step:", currentStep);


            updateUI();
        }
    };

    // Generatingg the detailed cost breakdown for  summary page
    const generateSummary = () => {
        const summaryContainer = $('#summaryContent').empty();

        console.log("starttt");

        const format = (value) => `₹${value.toLocaleString('en-IN')}`;
        const addItem = (label, value) => summaryContainer.append(`<div class="item"><span>${label}</span><span class="fw-semibold">${value}</span></div>`);


        if (estimatorData.websiteType.value) {
            console.log("Website type selected:", estimatorData.websiteType);
            addItem(`Website Type: ${estimatorData.websiteType.value}`, format(estimatorData.websiteType.cost));
        }
        if (estimatorData.pageCount.value)
            addItem(`Page Count: ${estimatorData.pageCount.value}`, format(estimatorData.pageCount.cost));

        if (estimatorData.additionalServices.length > 0)
            estimatorData.additionalServices.forEach(s => addItem(s.value, format(s.cost)));

        if (estimatorData.additionalFeatures.length > 0)
            estimatorData.additionalFeatures.forEach(f => addItem(f.value, format(f.cost)));

        $('#summaryTotal').text(format(estimatorData.totalCost));
        console.log("Total cost set to:", estimatorData.totalCost);


        // Simple estimated timeline 
        let weeks = estimatorData.totalCost > 80000 ? 10 : estimatorData.totalCost > 40000 ? 8 : estimatorData.totalCost > 20000 ? 6 : 4;
        $('#summaryTimeline').text(`${weeks - 2}-${weeks} weeks`);
    };

    // Generates the brief summary for the final quote form page
    const generateFormSummary = () => {
        let text = `Total Estimated Cost: ₹${estimatorData.totalCost.toLocaleString('en-IN')}. Selections: ${estimatorData.websiteType.value}, ${estimatorData.pageCount.value} pages.`;
        $('#formSummary').text(text);
    };

    // Main execution block when the DOM is ready
    $(document).ready(function () {
        // Load data from LocalStorage if it exists and is not a completed quote
        const savedData = JSON.parse(localStorage.getItem('estimatorData'));



        if (savedData && !savedData.clientInfo.name) {
            Object.assign(estimatorData, savedData);


            // Pre-select options based on loaded data
            if (estimatorData.websiteType.value) $(`#websiteType .card-option[data-value="${estimatorData.websiteType.value}"]`).addClass('selected');
            if (estimatorData.pageCount.value) $(`#pageCount .card-option[data-value="${estimatorData.pageCount.value}"]`).addClass('selected');

            const reselectToggleOptions = (section) => {
                estimatorData[section].forEach(s => {
                    const card = $(`.toggle-option[data-value="${s.value}"]`).addClass('selected');
                    card.find('input').removeClass('d-none');
                });
            };


            reselectToggleOptions('additionalServices');
            reselectToggleOptions('additionalFeatures');

            calculateTotal();
        }

        // Event Handlers
        nextBtn.on('click', window.nextStep);
        prevBtn.on('click', window.prevStep);

        // Handler for single-choice selections (radio button behavior)
        $('#websiteType, #pageCount').on('click', '.card-option', function () {
            const card = $(this);
            const id = card.closest('.row').attr('id');
            card.closest('.row').find('.card-option').removeClass('selected');
            card.addClass('selected');
            estimatorData[id] = { value: card.data('value'), cost: parseInt(card.data('cost')) };
            calculateTotal();
        });

        // Handler for multi-choice selections (checkbox behavior)
        $('.toggle-option').on('click', function () {
            const card = $(this);
            card.toggleClass('selected');

            const value = card.data('value');
            const cost = parseInt(card.data('cost'));
            const isSelected = card.hasClass('selected');

            // This robustly finds the section name from the parent's data-attribute
            const parentId = card.closest('[data-section]').data('section');

            card.find('input').toggleClass('d-none', !isSelected).trigger(isSelected ? 'focus' : 'blur');

            if (isSelected) {
                estimatorData[parentId].push({ value, cost });
            } else {
                estimatorData[parentId] = estimatorData[parentId].filter(item => item.value !== value);
            }
            calculateTotal();
        });

        // Handler for form submission with Bootstrap 5 validation
        // $('#quoteForm').on('submit', function (event) {
        //     event.preventDefault();
        //     event.stopPropagation();
        //     if (this.checkValidity() === false) {
        //         $(this).addClass('was-validated');
        //         return;
        //     }

        //     estimatorData.clientInfo = {
        //         name: $('#name').val(),
        //         phone: $('#phone').val(),
        //         email: $('#email').val(),
        //     };
        //     saveToLocalStorage();
        //     console.log("Quote Submitted:", estimatorData);

        //     // EmailJS or webhook integration can be added here

        //     currentStep = steps.length - 1; // Go to thank you page
        //     updateUI();
        // });


        /////////////////////////////////////////////////////////////////////
        // REPLACE your existing $('#quoteForm').on('submit', ...) with this:
        // Handler for form submission with Bootstrap 5 validation
        // REPLACE your existing $('#quoteForm').on('submit', ...) function with this:

$('#quoteForm').on('submit', function (event) {
    event.preventDefault(); // Stop the form from reloading the page
    event.stopPropagation();
    
    if (this.checkValidity() === false) {
        $(this).addClass('was-validated');
        return;
    }

    // Get the latest form data
    estimatorData.clientInfo = {
        name: $('#name').val(),
        phone: $('#phone').val(),
        email: $('#email').val(),
    };

    console.log("Attempting to submit data to server:", estimatorData);

    // Send the data to the PHP script
    $.ajax({
        type: "POST",
        url: "submit_quote.php", // Your PHP file
        data: JSON.stringify(estimatorData),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (response) {
            // THIS PART ONLY RUNS IF THE SERVER RESPONDS WITH SUCCESS (200 OK)
            console.log("Server responded successfully:", response);
            if (response.success) {
                // Now that we know it's saved, go to the thank you page
                currentStep = steps.length - 1;
                updateUI();
                localStorage.removeItem('estimatorData');
            } else {
                // If the server says there was a problem
                alert("Submission failed: " + response.message);
            }
        },
        error: function (xhr, status, error) {
            // THIS PART RUNS IF THE SERVER CAN'T BE REACHED OR CRASHES (404, 500)
            console.error("Server Error:", xhr.responseText);
            alert("A critical server error occurred. Please check the console (F12) for details.");
        }
    });
});
        /////////////////////////////////////////////////////////////////////////////
        // Initial UI setup on page load
        updateUI();
    });
})(jQuery); 