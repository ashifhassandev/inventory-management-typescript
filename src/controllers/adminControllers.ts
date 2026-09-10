import { Request, Response } from "express";
import bcrypt from "bcrypt";

import Admin from "../models/adminModel.js";
import Product, { ProductDocument } from "../models/productModel.js";

import httpStatusCodes from "../utils/httpStatusCodes.js";
import showFlashMessages from "../utils/messageUtils.js";

interface Locals {
    title: string;
}

const getAdminLogin = (req: Request, res: Response): void => {
    const locals: Locals = { title: "Admin Login | Inventory Management" };
    res.status(httpStatusCodes.OK).render("admin/adminLogin", {
        locals,
        layout: "layouts/authLayout",
    });
};

const adminLogin = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email })
            .select("_id email firstName lastName password")
            .lean();

        if (!admin) {
            return showFlashMessages({
                req,
                res,
                message: "Admin not found. Please try again.",
                status: httpStatusCodes.NOT_FOUND,
                redirectUrl: "/admin/login",
            });
        }

        const isPasswordMatch: boolean = await bcrypt.compare(password, admin.password);
        if (!isPasswordMatch) {
            return showFlashMessages({
                req,
                res,
                message: "Password does not match.",
                status: httpStatusCodes.UNAUTHORIZED,
                redirectUrl: "/admin/login",
            });
        }

        req.session.admin = {
            _id: admin._id,
            email: admin.email,
            firstName: admin.firstName,
            lastName: admin.lastName,
        };

        res.status(httpStatusCodes.OK).redirect("/admin/dashboard");
    } catch (error) {
        console.error("Error verifying the credentials:", error as Error);

        return showFlashMessages({
            req,
            res,
            message: "An error occurred. Please try again later.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/admin/login",
        });
    }
};

const getAdminSignup = (req: Request, res: Response): void => {
    const locals: Locals = { title: "Admin Signup | Inventory Management" };
    res.status(httpStatusCodes.OK).render("admin/signup", {
        locals,
        layout: "layouts/authLayout",
    });
};

const adminSignup = async (req: Request, res: Response): Promise<void> => {
    const { firstName, lastName, email, pwd, pwdConf } = req.body;

    try  {
        const existingUser = await Admin.exists({ email });
        if (existingUser) {
            return showFlashMessages({
                req,
                res,
                message: "Email already taken.",
                status: httpStatusCodes.BAD_REQUEST,
                redirectUrl: "/admin/signup",
            });
        }

        if (pwd !== pwdConf) {
            return showFlashMessages({
                req,
                res,
                message: "Passwords do not match.",
                status: httpStatusCodes.BAD_REQUEST,
                redirectUrl: "/admin/signup",
            });
        }

        await Admin.create({
            firstName,
            lastName,
            email,
            password: pwd,
        });

        return showFlashMessages({
            req,
            res,
            type: "success",
            message: "Admin registration successfull.",
            status: httpStatusCodes.CREATED,
            redirectUrl: "/admin/login",
        });
    } catch (error) {
        console.error("Error registering the user:", error as Error);

        return showFlashMessages({
            req,
            res,
            message: "An error occurred. Please try again later.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/admin/signup",
        });
    }
};

const getAdminDashboard = async (req: Request, res: Response): Promise<void> => {
    const locals: Locals = { title: "Admin Dashboard | Inventory Management" };

    try {
        const perPage: number = 12;
        const page: number = parseInt(req.query.page as string, 10) || 1;

        const products = await Product.aggregate([
            { $sort: { createdAt: -1 } }, 
            { $skip: (perPage * page) - perPage }, 
            { $limit: perPage },
        ]).exec();

        const count: number = await Product.countDocuments();

        res.render("admin/dashboard", {
            locals,
            products,
            count,
            current: page,
            pages: Math.ceil(count / perPage),
            layout: "layouts/adminLayout",
        });
    } catch (error) {
        console.error("Error verifying the credentials:", error as Error);

        return showFlashMessages({
            req,
            res,
            message: "An error occurred. Please try again later.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/admin/login",
        });
    }
};

const adminLogout = (req: Request, res: Response): void => {
    req.session.destroy((error) => {
        if (error) {
            console.log("Error destroying the session:", error as Error);
        }

        return res.redirect("/admin/login");
    });
};

const getAddProduct = (req: Request, res: Response): void => {
    const locals: Locals = { title: "Add Product | Inventory Management" };
    res.status(httpStatusCodes.OK).render("admin/addProduct", {
        locals,
        layout: "layouts/authLayout",
    });
};

const addProduct = async (req: Request, res: Response): Promise<void> => {
    const { name, category, stock, price } = req.body;

    try {
        const existingProduct = await Product.exists({ name: { $regex: `^${name}$`, $options: 'i' } })
        if (existingProduct) {
            return showFlashMessages({
                req,
                res,
                message: "Email already taken.",
                status: httpStatusCodes.BAD_REQUEST,
                redirectUrl: "/admin/addUser",
            });
        }

        await Product.create({
            name,
            category,
            stock,
            price,
        });

        return showFlashMessages({
            req,
            res,
            type: "success",
            message: `${name} added successfully.`,
            status: httpStatusCodes.CREATED,
            redirectUrl: "/admin/dashboard",
        });
    } catch (error) {
        console.error("Error adding the product:", error as Error);

        return showFlashMessages({
            req,
            res,
            message: "An error occurred. Please try again later.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/admin/addProduct",
        });
    }
};

const viewProduct = async (req: Request, res: Response): Promise<void> => {
    const locals: Locals = { title: "View Product | Inventory Management" };
    const { id } = req.params;

    try {
        const product = await Product.findById(id)
            .select("_id name category stock price createdAt updatedAt")
            .lean();

        res.render("admin/view", {
            locals,
            layout: "layouts/adminLayout",
            product,
        });
    } catch (error) {
        console.error("Error viewing the product:", error as Error);

        return showFlashMessages({
            req,
            res,
            message: "An error occurred. Please try again later.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/admin/dashboard",
        });
    }
};

const getEditProduct = async (req: Request, res: Response): Promise<void> => {
    const locals: Locals = { title: "Edit Product | Inventory Management" };
    const { id } = req.params;

    try {
        const product = await Product.findById(id)
            .select("_id name category stock price updatedAt")
            .lean();

        if (!product) {
            return showFlashMessages({
                req,
                res,
                message: "Product not found. Please try again.",
                status: httpStatusCodes.NOT_FOUND,
                redirectUrl: "/admin/dashboard",
            });
        }
        
        res.render("admin/edit", {
            locals,
            layout: "layouts/adminLayout",
            product,
        });
    } catch (error) {
        console.error("Error fetching edit product:", error as Error);

        return showFlashMessages({
            req,
            res,
            message: "An error occurred. Please try again later.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/admin/dashboard",
        });
    }
};

const editProduct = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name } = req.body;

    try {
        const existingProduct = await Product.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (existingProduct && existingProduct._id.toString() !== id) {
            return showFlashMessages({
                req,
                res,
                message: "A product with this name already exists.",
                status: httpStatusCodes.BAD_REQUEST,
                redirectUrl: `/admin/editProduct/${id}`,
            });
        }

        await Product.findByIdAndUpdate(
            id,
            { ...req.body, updatedAt: Date.now() },
        );

        return showFlashMessages({
            req,
            res,
            type: "success",
            message: "Product updated successfully.",
            status: httpStatusCodes.OK,
            redirectUrl: "/admin/dashboard",
        });
    } catch (error) {
        console.error("Error updating the product:", error as Error);

        return showFlashMessages({
            req,
            res,
            message: "An error occurred. Please try again later.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/admin/dashboard",
        });
    }
};

const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        await Product.deleteOne({ _id: id });

        return showFlashMessages({
            req,
            res,
            type: "success",
            message: "Product deleted successfully.",
            status: httpStatusCodes.OK,
            redirectUrl: "/admin/dashboard",
        });
    } catch (error) {
        console.error("Error deleting the product:", error as Error);

        return showFlashMessages({
            req,
            res,
            message: "An error occurred. Please try again later.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/admin/dashboard",
        });
    }
};

const searchProduct = async (req: Request, res: Response): Promise<void> => {
    const locals: Locals = { title: "Search Product | Inventory Management" };
    const searchTerm: string = req.body.searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");

    try {
        const products = await Product.find({
            $or: [
                { name: { $regex: searchTerm, $options: "i" } },
                { category: { $regex: searchTerm, $options: "i" } },
            ]
        })
        .select("_id name category stock price")
        .lean();

        res.render("admin/search", {
            locals,
            products,
            layout: 'layouts/adminLayout',
        });
    } catch (error) {
        console.error("Error searching the product:", error as Error);

        return showFlashMessages({
            req,
            res,
            message: "An error occurred. Please try again later.",
            status: httpStatusCodes.INTERNAL_SERVER_ERROR,
            redirectUrl: "/admin/dashboard",
        });
    }
};

export default {
    getAdminLogin,
    adminLogin,
    getAdminSignup,
    adminSignup,
    getAdminDashboard,
    adminLogout,
    getAddProduct,
    addProduct,
    viewProduct,
    getEditProduct,
    editProduct,
    deleteProduct,
    searchProduct,
};