const nodemailer = require('nodemailer');
require("dotenv").config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Correct SMTP host
    port: 465, // Use port 465 for secure connection
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

// Send Welcoming confirmation mail 
const sendConfirmationMail = (emailAddress, nameOfUser) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: emailAddress,
        subject: 'Your profile is updated',
        html: `<p>Welcome, ${nameOfUser}! <br> Thank you for updating your profile.</p>` // Fixed HTML
    };
    sendWelcomingMail(mailOptions); // Fixed function name
};

const sendWelcomingMail = function (mailOptions) { // Fixed function name
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};

module.exports = { sendConfirmationMail, sendWelcomingMail };