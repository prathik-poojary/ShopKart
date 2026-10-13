const bcrypt = require("bcrypt");
const Customer = require("../models/customer.model");
const generateToken = require("../utils/generateToken");


const registerCustomer = async (req, res) => {
    try {
        const {
            fullName,
            email,
            password,
            phone
        } = req.body;

        if (!fullName || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters"
            });
        }

    
        const existingCustomer = await Customer.findOne({
            email
        });

        if (existingCustomer) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

       
        const hashedPassword = await bcrypt.hash(password, 10);

        const customer = await Customer.create({
            fullName,
            email,
            password: hashedPassword,
            phone
        });

        return res.status(201).json({
            success: true,
            message: "Customer registered successfully",
            customer: {
                _id: customer._id,
                fullName: customer.fullName,
                email: customer.email,
                phone: customer.phone
            }
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};



const loginCustomer = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const customer = await Customer.findOne({
            email
        });

        if (!customer) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }
        const passwordMatch = await bcrypt.compare(
            password,
            customer.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const token = generateToken(customer._id);

        res.cookie("token", token, {
            httpOnly: true,
        });

        return res.status(200).json({
            success: true,
            message: "Login successful"
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};



const getMyProfile = async (req, res) => {
    try {

        return res.status(200).json({
            _id: req.user._id,
            fullName: req.user.fullName,
            email: req.user.email,
            phone: req.user.phone
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

const logoutCustomer = async (req, res) => {
    try {

        res.clearCookie("token");

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

const changePassword = async (req, res) => {
    try {

        const {
            oldPassword,
            newPassword
        } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Old password and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must contain at least 6 characters"
            });
        }

        const customer = await Customer.findById(req.user._id);

        if (!customer) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const passwordMatch = await bcrypt.compare(
            oldPassword,
            customer.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Old password is incorrect"
            });
        }

        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        customer.password = hashedPassword;

        await customer.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


module.exports = {
    registerCustomer,
    loginCustomer,
    getMyProfile,
    logoutCustomer,
    changePassword
};