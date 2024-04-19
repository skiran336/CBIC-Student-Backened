require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const dbConnectionString = process.env.DB_CONNECTION_STRING;
main();



async function main() {
    try {
        await mongoose.connect(dbConnectionString, {
            dbName: 'studentform', 
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('DB connected');
    } catch (err) {
        console.log('DB connection error:', err);
    }
}


const studentSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    major: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please fill a valid email address'] },
    phoneNumber: { type: String, required: true, trim: true, match: [/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/, 'Please fill a valid phone number'] },
    classStanding: { type: String, required: true, enum: ['Undergraduate', 'Graduate'] },
    teamMembers: [
        {
            name: String,
            email: String,
            _id: false 
        }
    ],
    // Fields from FormPage2
    track: { type: String, required: true },
    ideaName: { type: String, required: true, trim: true },
    question1: { type: String, required: true, trim: true }, 
    question2: { type: String, required: true, trim: true }, 
    question3: { type: String, required: true, trim: true }, 
    question4: { type: String, required: true, trim: true }, 
    timeToLaunch: { type: String, required: true } 
},
{
    timestamps: true 
});


const Student= mongoose.model('StudentForm', studentSchema);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const server = express();

server.use(cors({
    origin: 'https://cbic-student-side.vercel.app' 
}));
server.use(bodyParser.json());

server.post('/studentform', async (req,res) =>{
    console.log(req.body);

    let student = new Student({
        name: req.body.name,
        major: req.body.major,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        classStanding: req.body.classStanding,
        teamMembers: [
            {
                name: req.body.name2,
                email: req.body.email2
            },
            {
                name: req.body.name3,
                email: req.body.email3
            },
            {
                name: req.body.name4,
                email: req.body.email4
            }
        ],
        track: req.body.track,
        ideaName: req.body.ideaName,
        question1: req.body.question1,
        question2: req.body.question2,
        question3: req.body.question3,
        question4: req.body.question4,
        timeToLaunch: req.body.timeToLaunch

    });

    try {
        await student.save();
        
        const mailOptions = {
            from: process.env.EMAIL_USER, 
            to: req.body.email, 
            subject: 'Confirmation of CBIC Entry Form Submission', 
            text: 'Thank you for submitting your form. We have received your details.', 
            html: `<p>Thank you for submitting your form, <b>${req.body.name}</b>.</p>` 
        };

        transporter.sendMail(mailOptions, function (err, info) {
            if(err) {
                console.log(err);
                res.status(500).json({ message: 'Email could not be sent.', error: err });
            } else {
                console.log(info);
                res.status(201).json({ message: "Student form submitted successfully and email sent!" });
            }
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000; 
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
