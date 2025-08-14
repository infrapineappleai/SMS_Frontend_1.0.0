// src/api/dashboardAPI.js
import axios from "axios";

const API_BASE_URL = "https://aradanabeta.pineappleai.cloud/api/sms/api";

export const fetchDashboardSchedule = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/dashboard`);
    if (res.data.success) {
      return res.data.data;
    } else {
      throw new Error("Failed to fetch dashboard schedule");
    }
  } catch (err) {
    console.error("Error fetching dashboard schedule:", err);
    throw err;
  }
};
