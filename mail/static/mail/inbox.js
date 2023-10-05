document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Submit email handler
  document.querySelector('#compose-form').addEventListener('submit', function(event) {
    event.preventDefault(); 

    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    // Send Data to Backend
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
      })
    })
    .then(response => response.json())
    .then(result => {
      // Print result
      console.log(result);
      
      // Load the user's sent mailbox
      load_mailbox('sent');
    });

    // Clear the form fields after submission (optional)
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  });

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#emails-details-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id){
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);

      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#emails-details-view').style.display = 'block';

      document.querySelector('#emails-details-view').innerHTML = `
      <ul class="list-group">
          <li class="list-group-item"><strong>From:</strong> ${email.sender}</li>
          <li class="list-group-item"><strong>To:</strong> ${email.recipient}</li>
          <li class="list-group-item"><strong>Subject:</strong> ${email.subject}</li>
          <li class="list-group-item"><strong>Time:</strong> ${email.timestamp}</li>
          <li class="list-group-item">${email.body}</li>
      </ul>
      `;

      //Change email to read
      if(!email.read){
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        });
      }

      // Archived Logic 
      const archived_button = document.createElement('button');
      archived_button.innerHTML = email.archived ? "Unarchive" : "Archive";
      archived_button.className = email.archived ? "btn btn-success" : "btn btn-danger" ;
      archived_button.addEventListener('click', function() {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: !email.archived // Toggle archived status
          })
        })
        .then(() => {load_mailbox('inbox')}); // Load the inbox after archiving
      });
      document.querySelector('#emails-details-view').append(archived_button);

      // Reply Logic
      const reply_button = document.createElement('button');
      reply_button.innerHTML = "Reply";
      reply_button.className = "btn btn-info" ;
      reply_button.addEventListener('click', function() {
        compose_email();
  
        document.querySelector('#compose-recipients').value = email.sender ;
        let subject = email.subject
        if (!subject.startsWith("Re: ")){
          subject = "Re: " + email.subject ;
        }
        document.querySelector('#compose-subject').value = subject;
        document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote: ${email.body}`;
      });
      document.querySelector('#emails-details-view').append(reply_button);
  });
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-details-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show The user mailbox 
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      // loop through each email 
      emails.forEach(singleEmail => {
        // Create a new HTML element 
        const newEmail = document.createElement('div');
        newEmail.className = singleEmail.read ? 'list-group-item read' : 'list-group-item unread';
        newEmail.innerHTML = ` 
          <h6> Sender: ${singleEmail.sender} </h6>
          <h5> Subject: ${singleEmail.subject} </h5>
          <p> ${singleEmail.timestamp} </p>
        `;
        newEmail.addEventListener('click', () => view_email(singleEmail.id)); // Use arrow function to preserve context
        document.querySelector('#emails-view').append(newEmail);
      });
    });
}


