import { clerkClient } from "@clerk/express";

/* ===========================================================
   GET ALL CLERK USERS
=========================================================== */
export const getAllClerkUsers = async (req, res) => {
  try {
    const role = req.user.role;
    if (role !== "COE") {
      return res.status(403).json({
        success: false,
        message: "Only COE can view Clerk users",
      });
    }

    let users = [];
    let cursor = null;

    do {
      const response = await clerkClient.users.getUserList({
        limit: 100,
        cursor,
      });

      users = [...users, ...response.data];
      cursor = response.nextCursor;
    } while (cursor);

    const formatted = users.map((u) => ({
      id: u.id,
      email: u.emailAddresses?.[0]?.emailAddress || "",
      firstName: u.firstName,
      lastName: u.lastName,
      publicMetadata: u.publicMetadata || {},
      createdAt: u.createdAt,
      lastSignInAt: u.lastSignInAt,
      banned: u.banned || false,
    }));

    return res.json({
      success: true,
      count: formatted.length,
      users: formatted,
    });
  } catch (error) {
    console.error("Clerk Fetch Users Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================================
   DELETE CLERK USER
=========================================================== */
export const deleteClerkUser = async (req, res) => {
  try {
    const role = req.user.role;

    if (role !== "COE") {
      return res.status(403).json({
        success: false,
        message: "Only COE can delete users",
      });
    }

    const { id } = req.params;

    await clerkClient.users.deleteUser(id);

    res.json({
      success: true,
      message: `Clerk user ${id} deleted successfully`,
    });
  } catch (error) {
    console.error("Delete Clerk User Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
