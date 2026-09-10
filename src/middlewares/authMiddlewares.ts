import { Request, Response, NextFunction } from "express";

import Admin from "../models/adminModel.js";

import httpStatusCodes from "../utils/httpStatusCodes.js";
import showFlashMessages from "../utils/messageUtils.js";
  
// Middleware to check if user is an admin
const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.admin) {
        return showFlashMessages({
            req,
            res,
            message: "You must be logged in to access the page.",
            status: httpStatusCodes.UNAUTHORIZED,
            redirectUrl: "/admin/login",
        });
    }

    const admin = await Admin.findById(req.session.admin._id)
        .select("_id")
        .lean();

      if (!admin) {
        return showFlashMessages({
            req,
            res,
            message: "Admin not found.",
            status: httpStatusCodes.NOT_FOUND,
            redirectUrl: "/admin/login",
        });
      }

    next();
};

export {
    isAdmin,
};