// middleware/adminAuth.js
import jwt from "jsonwebtoken";




export default function adminAuth(req, res, next) {
    let token = req.headers.authorization;




    if (!token)
        return res.status(401).json({ erro: "Token não fornecido." });




    // Permite: "Bearer token" OU apenas "token"
    if (token.startsWith("Bearer ")) {
        token = token.substring(7);
    }




    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);




        if (decoded.tipo !== "admin") {
            return res.status(403).json({ erro: "Acesso permitido apenas para administradores." });
        }




        req.admin = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ erro: "Token inválido." });
    }
}
