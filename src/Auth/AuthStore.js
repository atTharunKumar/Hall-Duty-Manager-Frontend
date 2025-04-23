// import { create } from "zustand";
// import axios from "axios";

// const useAuthStore = create((set) => ({
//   user: null,
//   isLoading: false,
//   error: null,

//   loginWithGoogle: async (token) => {
//     set({ isLoading: true, error: null });
//     try {
//       const res = await axios.post(
//         "http://localhost:5000/auth/google",
//         { token },
//         { withCredentials: true }
//       );
//       set({ user: res.data.user });
//       return res.data.role;
//     } catch (error) {
//       console.error("Google login failed", error);
//       set({ error: "Login failed. Contact admin." });
//       return null;
//     } finally {
//       set({ isLoading: false });
//     }
//   },

//   logout: async () => {
//     try {
//       await axios.get("http://localhost:5000/auth/logout", {
//         withCredentials: true,
//       });
//       set({ user: null });
//     } catch (error) {
//       console.error("Logout failed", error);
//     }
//   },

//   fetchUser: async () => {
//     set({ isLoading: true });
//     try {
//       const res = await axios.get("http://localhost:5000/auth/user", { withCredentials: true });
//       set({ user: res.data });
//     } catch (error) {
//       console.error("Failed to fetch user:", error);
//       set({ user: null, error: "Failed to fetch user" });
//     } finally {
//       set({ isLoading: false });
//     }
//   },
// }));

// export default useAuthStore;
