let db = new Localbase('myDatabase');

document.getElementById('signUpForm').addEventListener('submit', signUp);
document.getElementById('signInForm').addEventListener('submit', signIn);
document.getElementById('signOutButton').addEventListener('click', signOut);
document.getElementById('dataForm').addEventListener('submit', addData);
document.getElementById('uploadButton').addEventListener('click', uploadData);
document.getElementById('export-button').addEventListener('click', exportData);

// Function to handle sign-up
async function signUp(event) {
  event.preventDefault();
  
  const email = document.getElementById('signUpEmail').value;
  const password = document.getElementById('signUpPassword').value;

  // Check if the user already exists
  const existingUser = await db.collection('users').doc({ email: email }).get();
  if (existingUser) {
    alert('User already exists. Please sign in.');
    return;
  }

  // Add new user to the database
  await db.collection('users').add({
    email: email,
    password: password // In a real-world application, use hashing for passwords
  });

  alert('Sign-up successful! Please sign in.');
}

// Function to handle sign-in
async function signIn(event) {
  event.preventDefault();
  
  const email = document.getElementById('signInEmail').value;
  const password = document.getElementById('signInPassword').value;

  // Check if the user exists and the password matches
  const user = await db.collection('users').doc({ email: email }).get();
  if (user && user.password === password) {
    alert('Sign-in successful!');
    localStorage.setItem('authenticatedUser', email);
    showAuthenticatedContent();
  } else {
    alert('Invalid email or password.');
  }
}

// Function to handle sign-out
function signOut() {
  localStorage.removeItem('authenticatedUser');
  alert('Signed out successfully.');
  showAuthenticatedContent();
}

// Function to add data to the database
async function addData(event) {
  event.preventDefault();
  
  const childName = document.getElementById('childName').value;
  const gender = document.querySelector('input[name="gender"]:checked').value;
  const ageOrDob = document.getElementById('ageOrDob').value;
  const outOfSchoolStatus = document.querySelector('input[name="outOfSchoolStatus"]:checked').value;
  const dateOfAssessment = document.getElementById('dateOfAssessment').value;
  const enumeratorName = document.getElementById('enumeratorName').value;
  const enumeratorPhone = document.getElementById('enumeratorPhone').value;
  const village = document.getElementById('village').value;
  const academicYear = document.querySelector('input[name="academicYear"]:checked').value;
  const id = Date.now(); // Use the current timestamp as a unique id
  const email = localStorage.getItem('authenticatedUser'); // Get the logged-in user's email

  if (enumeratorPhone && !/07[0-9]{8}/.test(enumeratorPhone)) {
    alert('Phone number must start with 07 and be 10 digits long.');
    return;
  }

  await db.collection('formData').add({
    id: id,
    childName: childName,
    gender: gender,
    ageOrDob: ageOrDob,
    outOfSchoolStatus: outOfSchoolStatus,
    dateOfAssessment: dateOfAssessment,
    enumeratorName: enumeratorName,
    enumeratorPhone: enumeratorPhone,
    village: village,
    academicYear: academicYear,
    email: email // Associate the data with the logged-in user's email
  });

  displayData();
  document.getElementById('dataForm').reset();
}

// Function to display data in the table
async function displayData() {
  const email = localStorage.getItem('authenticatedUser'); // Get the logged-in user's email
  const users = await db.collection('formData').get();
  const dataTable = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
  dataTable.innerHTML = '';

  // Filter data to show only the logged-in user's entries
  const userEntries = users.filter(user => user.email === email);

  userEntries.forEach(user => {
    const row = dataTable.insertRow();
    row.insertCell(0).innerText = user.childName;
    row.insertCell(1).innerText = user.gender;
    row.insertCell(2).innerText = user.ageOrDob;
    row.insertCell(3).innerText = user.outOfSchoolStatus;
    row.insertCell(4).innerText = user.dateOfAssessment;
    row.insertCell(5).innerText = user.enumeratorName;
    row.insertCell(6).innerText = user.enumeratorPhone;
    row.insertCell(7).innerText = user.village;
    row.insertCell(8).innerText = user.academicYear;
    const deleteCell = row.insertCell(9);
    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Delete';
    deleteButton.addEventListener('click', () => deleteData(user));
    deleteCell.appendChild(deleteButton);
  });
}

// Function to delete data
async function deleteData(user) {
  await db.collection('formData').doc({ id: user.id }).delete();
  displayData();
}

// Function to export data to a JSON file
async function exportData() {
  const email = localStorage.getItem('authenticatedUser'); // Get the logged-in user's email
  const users = await db.collection('formData').get();

  // Filter data to show only the logged-in user's entries
  const userEntries = users.filter(user => user.email === email);

  const dataStr = JSON.stringify(userEntries, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'indexeddb-data.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Function to show/hide authenticated content
function showAuthenticatedContent() {
  const authenticatedUser = localStorage.getItem('authenticatedUser');
  if (authenticatedUser) {
    document.getElementById('signUpForm').style.display = 'none';
    document.getElementById('signInForm').style.display = 'none';
    document.getElementById('authenticatedContent').style.display = 'block';
    displayData(); // Display data for the logged-in user
  } else {
    document.getElementById('signUpForm').style.display = 'block';
    document.getElementById('signInForm').style.display = 'block';
    document.getElementById('authenticatedContent').style.display = 'none';
  }
}

// Display data on initial load
showAuthenticatedContent();

// Function to handle file upload and process Excel data
async function uploadData() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  if (!file) {
    alert('Please select an Excel file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    for (const row of jsonData) {
      const {
        "Child's Full Name": childName,
        "Gender": gender,
        "Age or Date of Birth": ageOrDob,
        "Out of School Status": outOfSchoolStatus,
        "Date of Assessment": dateOfAssessment,
        "Name of Enumerator": enumeratorName,
        "Enumerator Phone Number": enumeratorPhone,
        "Village": village,
        "Academic Year": academicYear
      } = row;

      const id = Date.now() + Math.random(); // Use a combination of timestamp and random number as a unique id
      const email = localStorage.getItem('authenticatedUser'); // Get the logged-in user's email

      if (enumeratorPhone && !/07[0-9]{8}/.test(enumeratorPhone)) {
        alert(`Invalid phone number: ${enumeratorPhone}`);
        continue;
      }

      await db.collection('formData').add({
        id: id,
        childName: childName,
        gender: gender,
        ageOrDob: ageOrDob,
        outOfSchoolStatus: outOfSchoolStatus,
        dateOfAssessment: dateOfAssessment,
        enumeratorName: enumeratorName,
        enumeratorPhone: enumeratorPhone,
        village: village,
        academicYear: academicYear,
        email: email // Associate the data with the logged-in user's email
      });
    }

    displayData();
    alert('Data uploaded successfully.');
  };

  reader.readAsArrayBuffer(file);
}
