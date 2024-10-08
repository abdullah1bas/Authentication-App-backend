const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  const { first_name, last_name, email, password , role} = req.body;
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  const foundUser = await User.findOne({ email }).exec();
  if (foundUser) {
    return res.status(401).json({ message: 'User already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    first_name,
    last_name,
    email,
    password: hashedPassword,
    role: role || 'user' // تعيين الدور
  });
  const accessToken = jwt.sign(
    {
      UserInfo: {
        id: user._id,
        role: user.role // إضافة الدور إلى التوكن
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: 10 }
  );
  const refreshToken = jwt.sign(
    {
      UserInfo: {
        id: user._id,
        role: user.role // إضافة الدور إلى التوكن
      },
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  res.cookie('jwt', refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    sameSite: 'None', //cross-site cookie
    maxAge: 7 * 24 * 60 * 60 * 1000, // da value millSec for { expiresIn: '7d' }
  });
  res.json({
    accessToken,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role // إرجاع الدور في الرد
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  const foundUser = await User.findOne({ email }).exec();
  if (!foundUser) {
    return res.status(401).json({ message: 'User does not exist' });
  }
  const match = await bcrypt.compare(password, foundUser.password);

  if (!match) return res.status(401).json({ message: 'Wrong Password' });

  const accessToken = jwt.sign(
    {
      UserInfo: {
        id: foundUser._id,
        role: foundUser.role // تضمين الدور في التوكن
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    {
      UserInfo: {
        id: foundUser._id,
        role: foundUser.role // تضمين الدور في التوكن
      },
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
  res.cookie('jwt', refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    sameSite: 'None', //cross-site cookie
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({
    accessToken,
    email: foundUser.email,
    role: foundUser.role // إرجاع الدور في الرد
  });
};

const refresh = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) res.status(401).json({ message: 'Unauthorized' });
  const refreshToken = cookies.jwt;
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Forbidden' });
      const foundUser = await User.findById(decoded.UserInfo.id).exec();
      if (!foundUser) return res.status(401).json({ message: 'Unauthorized' });
      // إصدار access token جديد مع تضمين الـ role
      const accessToken = jwt.sign(
        {
          UserInfo: {
            id: foundUser._id,
            role: foundUser.role, // تضمين الـ role
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );
      res.json({ accessToken });
    }
  );
};

const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie('jwt', {
    httpOnly: true,
    sameSite: 'None',
    secure: true,
  });
  res.json({ message: 'Cookie cleared' });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
};
