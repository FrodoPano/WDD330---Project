document.addEventListener('DOMContentLoaded', () => {
    const formElem = document.getElementById('formElem');
    
    formElem.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        // Create FormData from the form
        const formData = new FormData(formElem);
        
        // Add additional fields using append()
        formData.append('submissionDate', new Date().toISOString());
        
        // Add another field using set() (will replace if already exists)
        formData.set('clientTimezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
        
        // Log all form data to console
        console.log('--- Form Data Contents ---');
        for (let [name, value] of formData) {
            if (value instanceof File) {
                console.log(`${name}: File (${value.name}, ${value.type}, ${value.size} bytes)`);
            } else {
                console.log(`${name}: ${value}`);
            }
        }
        
        // Simulate what would be sent in a fetch request
        console.log('\n--- What would be sent to server ---');
        const entries = Array.from(formData.entries());
        console.log(entries);
        
        // Show success message to user
        alert('Form data captured successfully! Check console for details.');
        
        // In a real application, you would send the data like this:
        /*
        try {
            const response = await fetch('/api/submit-form', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            console.log('Server response:', result);
        } catch (error) {
            console.error('Error submitting form:', error);
        }
        */
    });
});