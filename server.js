
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// =====================================
// DATA FOLDER
// =====================================

const dataDir = path.join(__dirname, "data");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const usersFile = path.join(dataDir, "users.json");
const jobsFile = path.join(dataDir, "jobs.json");
const applicationsFile = path.join(dataDir, "applications.json");

// Create files if they don't exist
function createDataFile(file) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, "[]", "utf8");
    }
}

createDataFile(usersFile);
createDataFile(jobsFile);
createDataFile(applicationsFile);

// =====================================
// DATA FUNCTIONS
// =====================================

function readData(file) {
    try {
        const data = fs.readFileSync(file, "utf8");

        if (!data.trim()) {
            return [];
        }

        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading:", file);
        return [];
    }
}

function writeData(file, data) {
    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

function getUsers() {
    return readData(usersFile);
}

function saveUsers(users) {
    writeData(usersFile, users);
}

function getJobs() {
    return readData(jobsFile);
}

function saveJobs(jobs) {
    writeData(jobsFile, jobs);
}

function getApplications() {
    return readData(applicationsFile);
}

function saveApplications(applications) {
    writeData(applicationsFile, applications);
}

// =====================================
// SAFE USER
// =====================================

function safeUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        suspensionReason: user.suspensionReason || "",
        createdAt: user.createdAt
    };
}

// =====================================
// ADMIN AUTHENTICATION
// =====================================

function requireAdmin(req, res, next) {
    const userId = req.headers["x-user-id"];

    if (!userId) {
        return res.status(401).json({
            message: "Admin login required."
        });
    }

    const users = getUsers();

    const user = users.find(
        u => String(u.id) === String(userId)
    );

    if (!user) {
        return res.status(401).json({
            message: "User not found."
        });
    }

    if (user.role !== "admin") {
        return res.status(403).json({
            message: "Admin access required."
        });
    }

    if (user.status === "suspended") {
        return res.status(403).json({
            message: "Admin account is suspended."
        });
    }

    req.admin = user;

    next();
}

// =====================================
// HOME
// =====================================

app.get("/", (req, res) => {
    res.json({
        message: "JobHub backend is running",
        status: "online"
    });
});

// =====================================
// REGISTER
// =====================================

app.post("/api/register", async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role
        } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "Please fill in all fields."
            });
        }

        if (!["client", "freelancer"].includes(role)) {
            return res.status(400).json({
                message: "Invalid role."
            });
        }

        const users = getUsers();

        const existingUser = users.find(
            user =>
                user.email.toLowerCase() ===
                email.toLowerCase()
        );

        if (existingUser) {
            return res.status(400).json({
                message: "Email is already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        const newUser = {
            id: Date.now().toString(),
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            status: "active",
            suspensionReason: "",
            createdAt: new Date().toISOString()
        };

        users.push(newUser);

        saveUsers(users);

        res.status(201).json({
            message: "Registration successful.",
            user: safeUser(newUser)
        });

    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            message: "Server error during registration."
        });
    }
});

// =====================================
// LOGIN
// =====================================

app.post("/api/login", async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }



        const users = getUsers();

        const user = users.find(
            u =>
                u.email.toLowerCase() ===
                email.toLowerCase()
        );

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        if (user.status === "suspended") {
            return res.status(403).json({
                message: "Your account has been suspended.",
                suspended: true,
                reason: user.suspensionReason || "No reason provided."
            });
        }

        res.json({
            message: "Login successful.",
            user: safeUser(user)
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: "Server error during login."
        });
    }
});


// =====================================
// FORGOT PASSWORD
// =====================================

app.post("/api/forgot-password", (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email address is required."
            });
        }

        const users = getUsers();

        const user = users.find(
            u =>
                u.email.toLowerCase() ===
                email.toLowerCase()
        );

        if (!user) {
            return res.status(404).json({
                message: "No account was found with this email."
            });
        }

        // Generate 6-digit code
        const resetCode =
            Math.floor(
                100000 +
                Math.random() * 900000
            ).toString();

        const expiresAt =
            Date.now() +
            10 * 60 * 1000;

        user.resetCode = resetCode;
        user.resetCodeExpires = expiresAt;

        saveUsers(users);

        console.log(
            "================================"
        );

        console.log(
            "JOBHUB PASSWORD RESET"
        );

        console.log(
            "Email:",
            user.email
        );

        console.log(
            "Reset Code:",
            resetCode
        );

        console.log(
            "Expires:",
            new Date(expiresAt)
        );

        console.log(
            "================================"
        );

        res.json({
            message:
                "Password reset code generated.",
            resetCode
        });

    } catch (error) {

        console.error(
            "Forgot password error:",
            error
        );

        res.status(500).json({
            message:
                "Server error creating reset code."
        });

    }

});


// =====================================
// RESET PASSWORD
// =====================================

app.post("/api/reset-password", async (req, res) => {

    try {

        const {
            email,
            code,
            newPassword
        } = req.body;


        if (
            !email ||
            !code ||
            !newPassword
        ) {

            return res.status(400).json({
                message:
                    "Email, code and new password are required."
            });

        }


        if (newPassword.length < 6) {

            return res.status(400).json({
                message:
                    "Password must contain at least 6 characters."
            });

        }


        const users =
            getUsers();


        const user =
            users.find(
                u =>
                    u.email.toLowerCase() ===
                    email.toLowerCase()
            );


        if (!user) {

            return res.status(404).json({
                message:
                    "User account not found."
            });

        }


        if (!user.resetCode) {

            return res.status(400).json({
                message:
                    "No password reset request was found."
            });

        }


        if (
            user.resetCode !==
            code
        ) {

            return res.status(400).json({
                message:
                    "Invalid reset code."
            });

        }


        if (
            Date.now() >
            user.resetCodeExpires
        ) {

            user.resetCode = null;
            user.resetCodeExpires = null;

            saveUsers(users);

            return res.status(400).json({
                message:
                    "Reset code has expired. Please request a new one."
            });

        }


        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );


        user.password =
            hashedPassword;


        // Remove used reset code
        user.resetCode =
            null;

        user.resetCodeExpires =
            null;


        saveUsers(users);


        res.json({

            message:
                "Password changed successfully."

        });


    } catch (error) {

        console.error(
            "Reset password error:",
            error
        );

        res.status(500).json({
            message:
                "Server error resetting password."
        });

    }

});



// =====================================
// GET USER
// =====================================
// =====================================
// LOGIN
// =====================================

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const users = getUsers();

        // Remove spaces and make email lowercase
        const cleanEmail = email.trim().toLowerCase();

        const user = users.find(
            u => String(u.email).trim().toLowerCase() === cleanEmail
        );

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        // Prevent suspended users from logging in
        if (user.status === "suspended") {
            return res.status(403).json({
                message: "Your account is suspended.",
                suspended: true,
                reason: user.suspensionReason || "No reason provided."
            });
        }

        res.json({
            message: "Login successful.",
            user: safeUser(user)
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: "Server error during login."
        });
    }
});

// =====================================
// UPDATE USER
// =====================================

app.put("/api/users/:id", (req, res) => {
    const users = getUsers();

    const index = users.findIndex(
        u => String(u.id) === String(req.params.id)
    );

    if (index === -1) {
        return res.status(404).json({
            message: "User not found."
        });
    }

    const {
        name
    } = req.body;

    if (name) {
        users[index].name = name;
    }

    saveUsers(users);

    res.json({
        message: "Profile updated successfully.",
        user: safeUser(users[index])
    });
});

// =====================================
// GET ALL JOBS
// =====================================

app.get("/api/jobs", (req, res) => {
    const jobs = getJobs();

    res.json(jobs);
});

// =====================================
// GET SINGLE JOB
// =====================================

app.get("/api/jobs/:id", (req, res) => {
    const jobs = getJobs();

    const job = jobs.find(
        j => String(j.id) === String(req.params.id)
    );

    if (!job) {
        return res.status(404).json({
            message: "Job not found."
        });
    }

    res.json(job);
});

// =====================================
// CREATE JOB
// =====================================

app.post("/api/jobs", (req, res) => {
    try {
        const {
            title,
            description,
            category,
            budget,
            currency,
            deadline,
            clientName,
            clientEmail
        } = req.body;

        if (
            !title ||
            !description ||
            !category ||
            !budget ||
            !currency ||
            !deadline ||
            !clientName ||
            !clientEmail
        ) {
            return res.status(400).json({
                message: "Please provide all job details."
            });
        }

        const users = getUsers();

        const client = users.find(
            user =>
                user.email.toLowerCase() ===
                clientEmail.toLowerCase()
        );

        if (client && client.status === "suspended") {
            return res.status(403).json({
                message: "Suspended users cannot post jobs."
            });
        }

        const jobs = getJobs();

        const newJob = {
            id: Date.now().toString(),
            title,
            description,
            category,
            budget,
            currency,
            deadline,
            clientName,
            clientEmail,
            status: "open",
            createdAt: new Date().toISOString()
        };

        jobs.push(newJob);

        saveJobs(jobs);

        res.status(201).json({
            message: "Job posted successfully!",
            job: newJob
        });

    } catch (error) {
        console.error("Create job error:", error);

        res.status(500).json({
            message: "Server error creating job."
        });
    }
});

// =====================================
// CREATE APPLICATION
// =====================================

app.post("/api/applications", (req, res) => {
    try {
        const {
            jobId,
            freelancerId,
            freelancerName,
            freelancerEmail,
            coverLetter
        } = req.body;

        if (
            !jobId ||
            !freelancerId ||
            !freelancerName ||
            !freelancerEmail ||
            !coverLetter
        ) {
            return res.status(400).json({
                message: "Please provide all application details."
            });
        }

        const jobs = getJobs();

        const job = jobs.find(
            j => String(j.id) === String(jobId)
        );

        if (!job) {
            return res.status(404).json({
                message: "Job not found."
            });
        }

        const users = getUsers();

        const freelancer = users.find(
            u => String(u.id) === String(freelancerId)
        );

        if (
            freelancer &&
            freelancer.status === "suspended"
        ) {
            return res.status(403).json({
                message: "Suspended freelancers cannot apply."
            });
        }

        const applications = getApplications();

        const duplicate = applications.find(
            application =>
                String(application.jobId) === String(jobId) &&
                String(application.freelancerId) === String(freelancerId)
        );

        if (duplicate) {
            return res.status(400).json({
                message: "You have already applied for this job."
            });
        }

        const newApplication = {
            id: Date.now().toString(),
            jobId,
            jobTitle: job.title,
            clientName: job.clientName,
            clientEmail: job.clientEmail,
            freelancerId,
            freelancerName,
            freelancerEmail,
            coverLetter,
            status: "pending",
            createdAt: new Date().toISOString()
        };

        applications.push(newApplication);

        saveApplications(applications);

        res.status(201).json({
            message: "Application submitted successfully!",
            application: newApplication
        });

    } catch (error) {
        console.error("Application error:", error);

        res.status(500).json({
            message: "Server error submitting application."
        });
    }
});

// =====================================
// FREELANCER APPLICATIONS
// =====================================

app.get(
    "/api/applications/freelancer/:email",
    (req, res) => {

        const applications = getApplications();

        const email = req.params.email.toLowerCase();

        const userApplications = applications.filter(
            application =>
                application.freelancerEmail.toLowerCase() === email
        );

        res.json(userApplications);
    }
);

// =====================================
// CLIENT APPLICATIONS
// =====================================

app.get(
    "/api/applications/client/:email",
    (req, res) => {

        const applications = getApplications();

        const email = req.params.email.toLowerCase();

        const clientApplications = applications.filter(
            application =>
                application.clientEmail.toLowerCase() === email
        );

        res.json(clientApplications);
    }
);

// =====================================
// ADMIN - ALL USERS
// =====================================

app.get(
    "/api/admin/users",
    requireAdmin,
    (req, res) => {

        const users = getUsers();

        res.json(
            users.map(user => safeUser(user))
        );
    }
);

// =====================================
// ADMIN - STATISTICS
// =====================================

app.get(
    "/api/admin/stats",
    requireAdmin,
    (req, res) => {

        const users = getUsers();

        const total = users.length;

        const active = users.filter(
            user => user.status === "active"
        ).length;

        const suspended = users.filter(
            user => user.status === "suspended"
        ).length;

        res.json({
            total,
            active,
            suspended
        });
    }
);

// =====================================
// ADMIN - SUSPEND USER
// =====================================

app.put(
    "/api/admin/users/:id/suspend",
    requireAdmin,
    (req, res) => {

        const {
            reason
        } = req.body;

        const users = getUsers();

        const index = users.findIndex(
            user =>
                String(user.id) ===
                String(req.params.id)
        );

        if (index === -1) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        if (users[index].role === "admin") {
            return res.status(403).json({
                message: "Admins cannot be suspended."
            });
        }

        users[index].status = "suspended";

        users[index].suspensionReason =
            reason || "Account suspended by administrator.";

        saveUsers(users);

        res.json({
            message: "User suspended successfully.",
            user: safeUser(users[index])
        });
    }
);

// =====================================
// ADMIN - ACTIVATE USER
// =====================================

app.put(
    "/api/admin/users/:id/activate",
    requireAdmin,
    (req, res) => {

        const users = getUsers();

        const index = users.findIndex(
            user =>
                String(user.id) ===
                String(req.params.id)
        );

        if (index === -1) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        users[index].status = "active";
        users[index].suspensionReason = "";

        saveUsers(users);

        res.json({
            message: "User activated successfully.",
            user: safeUser(users[index])
        });
    }
);

// =====================================
// ADMIN - DELETE USER
// =====================================

app.delete(
    "/api/admin/users/:id",
    requireAdmin,
    (req, res) => {

        const users = getUsers();

        const index = users.findIndex(
            user =>
                String(user.id) ===
                String(req.params.id)
        );

        if (index === -1) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        if (users[index].role === "admin") {
            return res.status(403).json({
                message: "Admins cannot be deleted."
            });
        }

        const deletedUser = users[index];

        users.splice(index, 1);

        saveUsers(users);

        res.json({
            message: "User deleted successfully.",
            user: safeUser(deletedUser)
        });
    }
);

// =====================================
// 404
// =====================================

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found."
    });
});

// =====================================
// ERROR HANDLER
// =====================================

app.use((error, req, res, next) => {
    console.error("Server error:", error);

    res.status(500).json({
        message: "Internal server error."
    });
});

// =====================================
// START SERVER
// =====================================

app.listen(PORT, () => {
    console.log(
        `JobHub server running at http://localhost:${PORT}`
    );
});