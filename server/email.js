const nodemailer = require('nodemailer');

class Email{
    constructor(oConfig){
        this.createTransport = nodemailer.createTransport(oConfig);
    }

    sendEmail(oEmail){
        try {
            this.createTransport.sendMail(oEmail,function(error, info){
                if(error){
                    console.log("Error al enviar correo" +error);
                }else{
                    console.log("Correo enviado correctamente");
                }
            
                
            });
        } catch (error) {
            console.log("Email.enviarCorreo -- Error -- "+error);
        }
    }
}
module.exports = Email;