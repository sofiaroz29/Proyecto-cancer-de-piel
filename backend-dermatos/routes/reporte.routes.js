import { Router } from "express";
import multer from "multer";
import  Reporte  from '../models/reporte.js';
import path from "path";
import {jsPDF} from "jspdf";
import fetch from 'node-fetch';

const router = Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'Images')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: '1000000' },
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif|jfif/
        const mimeType = fileTypes.test(file.mimetype)  
        const extname = fileTypes.test(path.extname(file.originalname))

        if(mimeType && extname) {
            return cb(null, true)
        }
        cb('Formato de imagen invalido')
    }
});

router.post('/upload', upload.array("imagen", 1), async (req,res) =>{

    const {parte_del_cuerpo, sintomas, antecedentes, conducta_sol, fototipos} = req.body;
    console.log(req.files);
    if (!req.files) {
        res.send("File was not found");
        return;
    }

    const imgformat = (req.files[0].mimetype).split('/');
    console.log(imgformat); 

    const newAnalysisRequest = await Reporte.create({
        parte_del_cuerpo,
        sintomas,
        antecedentes,
        conducta_sol,
        fototipos,
        imagen: req.files[0].path,
        imgformat: imgformat[1],
    });

    if (!req.files) {
        res.json({message: "Debes ingresar una imagen"});
    };
    
    if (newAnalysisRequest) {
        res.json({message: "Se ha subido correctamente"});
    };
    
    var data = new FormData()
    data.append('imagen', req.files[0])

    await fetch ("http://localhost:5000/flask", {
        method: 'POST',
        headers: {
        'Content-Type': 'multipart/form-data',
        },
        body: data,
    }).catch((err) => {
        console.log("Error: ", err);
    });

   
        
});


router.get('/analysisresults', async (req,res) =>{ 

    // const {token} = req.headers.authorization;

    // const accesstoken = token.split(" ")[1];
    // const verify = jwt.verify(accesstoken, process.env.JWT_SECRET);


    // const analysis = await Reporte.findOne({ 
    //     where: { id: verify.id },
    //     order:[ [ 'createdAt', 'DESC' ]],
    // }).catch((err) => {
    //     console.log("Error: ", err);
    // });
   
    // const user = await Usuario.findOne({
    //     where: { id: verify.id }
    // }).catch((err) => {
    //     console.log("Error: ", err);
    // });

    // console.log(analysis);

    const doc = new jsPDF();
    doc.setFontSize(40);
    doc.setFont("helvetica", "bold");
    doc.text("Informe", 105, 45, null, null, "center");
    doc.setFontSize(23);
    doc.setFont("helvetica", "normal");
    doc.text("Fecha: " + analysis.createdAt, 30, 80);
    doc.text("Datos Personales", 30, 95); 
    doc.setFontSize(20);
    doc.setFontSize(23);
    doc.text("Evaluacion", 30, 142);
    doc.setFontSize(20);
    doc.text("Parte del cuerpo: " + analysis.parte_del_cuerpo, 30, 153); 
    doc.text("Síntomas: " + analysis.sintomas, 30, 162);
    doc.text("Antecedentes: " + analysis.antecedentes, 30, 172);
    doc.text("Conducta respecto al sol: " + analysis.conducta_sol, 30, 182);
    doc.text("Fototipo: " + analysis.fototipos, 30, 192);
    doc.setFontSize(23);
    doc.text("Resultado: " + analysis.estado, 30, 212);
    doc.addImage(analysis.imagen, analysis.imgformat, 30, 225, 50, 50);
    
    doc.save("Analysis-Dermatos-" + Date.now() + ".pdf");
    
    

});


export default router;
