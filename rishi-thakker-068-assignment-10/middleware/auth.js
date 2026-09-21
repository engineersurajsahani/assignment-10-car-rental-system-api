const supabase = require("../config/supabase");

// Verifies the Supabase access token sent as a plain header: token: <access_token>
const auth = async (request, response, next) => {
  try {
    const token = request.headers.token;

    if (!token) {
      return response.status(400).json({ message: "Token is not provided" });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return response.status(400).json({ message: "Token is invalid" });
    }

    request.user = data.user;
    next();
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
};

module.exports = auth;