import axios from "axios";
import { Platform } from "react-native";

let baseURL = "";

if (Platform.OS === "android") {
  baseURL = "http://10.0.2.2:3000/api"; // emulador Android
} else if (Platform.OS === "ios") {
  baseURL = "http://192.168.0.3:3000/api"; // simulador iOS
} else {
  // 👇 Para Web (W en expo)
  baseURL = "http://localhost:3000/api"; 
}

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
