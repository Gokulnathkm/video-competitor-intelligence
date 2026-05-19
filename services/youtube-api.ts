import axios from "axios";

export const youtubeApi = axios.create({
  baseURL: "https://www.googleapis.com/youtube/v3",
  timeout: 12000,
});
