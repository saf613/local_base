// Initialize Localbase
let db = new Localbase('myDatabase');

// Function to display data from Localbase
function displayData() {
    db.collection('users').get().then(users => {
        let dataTable = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
        dataTable.innerHTML = ""; // Clear existing data
        users.forEach(user => {
            let row = dataTable.insertRow();
            row.setAttribute('data-id', user.id);

            let firstNameCell = row.insertCell(0);
            let lastNameCell = row.insertCell(1);
            let dobCell = row.insertCell(2);
            let provinceCell = row.insertCell(3);
            let actionCell = row.insertCell(4);

            firstNameCell.innerHTML = user.firstName;
            lastNameCell.innerHTML = user.lastName;
            dobCell.innerHTML = user.dob;
            provinceCell.innerHTML = user.province;

            let deleteButton = document.createElement('button');
            deleteButton.innerHTML = 'Delete';
            deleteButton.className = 'delete-btn';
            deleteButton.onclick = () => deleteData(user.id);
            actionCell.appendChild(deleteButton);
        });
    });
}

// Function to delete data from Localbase
function deleteData(id) {
    db.collection('users').doc({ id: id }).delete().then(() => {
        alert('Record deleted successfully!');
        displayData(); // Refresh the displayed data
    }).catch(error => {
        console.error('Error deleting document: ', error);
    });
}

// Add an event listener to the form
document.getElementById('dataForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission

    // Get the form data
    let firstName = document.getElementById('firstName').value;
    let lastName = document.getElementById('lastName').value;
    let dob = document.getElementById('dob').value;
    let province = document.querySelector('input[name="province"]:checked').value;

    // Add data to Localbase
    let id = new Date().getTime(); // Generate a unique ID based on timestamp
    db.collection('users').add({
        id: id,
        firstName: firstName,
        lastName: lastName,
        dob: dob,
        province: province
    }).then(() => {
        alert('Data saved successfully!');
        document.getElementById('dataForm').reset(); // Reset the form
        displayData(); // Refresh the displayed data
    }).catch(error => {
        console.error('Error adding document: ', error);
    });
});

// Display data on initial load
window.onload = displayData;
