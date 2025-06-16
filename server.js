// Khai báo thư viện dotenv
import dotenv from "dotenv";
dotenv.config();
// Khai báo thư viện http
import http from "http";
// Khai báo port web cho Service
const port = process.env.PORT;
// Khai báo thư viện mongoDB.js
import db from "./libs/mongoDB.js";
// Khai báo thư viện fs
import fs from "fs";
// Khai báo thư viện sendMail.js
import sendMail from "./libs/sendMail.js";
// Khai báo thư viện multer để xử lý upload file
import multer from "multer";
import path from "path";
// Khai báo ObjectId từ MongoDB
import { ObjectId } from "mongodb";

// Cấu hình Dịch vụ
const server = http.createServer((req, res) => {

    let method = req.method;
    let url = req.url;
    let result = `Serdvices Node: Method: ${method} - Url: ${url}`;
    
    // Cấu hình CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // Xử lý preflight request
    if (method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
    }

    if (method == "GET") {
        let collectionName = db.collectionNames[req.url.replace("/", "")]
        if (collectionName) {
            db.getAll(collectionName).then((kq) => {
                result = JSON.stringify(kq);
                res.end(result);
            })
        } else if (url === "/banners") {
            db.getAll("banners").then((kq) => {
                result = JSON.stringify(kq);
                res.end(result);
            })
        } else if (url.match(/^\/banners\/[a-zA-Z0-9]+$/)) {
            const id = url.split('/')[2];
            console.log('Getting banner with ID:', id); // Debug log
            try {
                const objectId = new ObjectId(id);
                db.getOne("banners", { _id: objectId }).then((kq) => {
                    console.log('Found banner:', kq); // Debug log
                    if (kq) {
                        result = JSON.stringify(kq);
                    } else {
                        result = JSON.stringify({ error: "Banner not found" });
                    }
                    res.end(result);
                }).catch((err) => {
                    console.error("Error getting banner:", err);
                    result = JSON.stringify({ error: "Error retrieving banner" });
                    res.end(result);
                })
            } catch (error) {
                console.error("Invalid ObjectId:", error);
                result = JSON.stringify({ error: "Invalid banner ID" });
                res.end(result);
            }
        } else if (url.match(/^\/images\/banners\/.+\.png$/)) {
            // Xử lý request ảnh banner
            let imagePath = url.replace('/images/banners/', 'images/banners/');
            console.log('Looking for image at:', imagePath); // Debug log
            
            try {
                if (!fs.existsSync(imagePath)) {
                    console.log('Image not found at:', imagePath); // Debug log
                    imagePath = 'images/noImage.png';
                }
                
                const fileStream = fs.createReadStream(imagePath);
                res.writeHead(200, { "Content-Type": "image/png" });
                fileStream.pipe(res);
            } catch (error) {
                console.error('Error serving image:', error);
                res.writeHead(404);
                res.end();
            }
        } else if (url.match("\.png$")) {
            let imagePath = `images${url}`;
            if (!fs.existsSync(imagePath)) {
                imagePath = `images/noImage.png`;
            }
            let fileStream = fs.createReadStream(imagePath);
            res.writeHead(200, { "Content-Type": "image/png" });
            fileStream.pipe(res);
        } else if (url === "/api/about") {
            if (method === "GET") {
                db.getOne("about", {}).then((kq) => {
                    result = JSON.stringify(kq || { content: "" });
                    res.end(result);
                }).catch((err) => {
                    console.error("Error getting about:", err);
                    result = JSON.stringify({ error: "Error retrieving about content" });
                    res.end(result);
                });
            } else if (method === "POST") {
                req.on("end", () => {
                    let new_document = JSON.parse(noi_dung_nhan);
                    // Xóa tất cả nội dung cũ
                    db.deleteMany("about", {}).then(() => {
                        // Thêm nội dung mới
                        db.insertOne("about", new_document).then((result) => {
                            res.end(JSON.stringify({ success: true }));
                        }).catch((err) => {
                            console.error("Error updating about:", err);
                            res.end(JSON.stringify({ error: "Error updating about content" }));
                        });
                    }).catch((err) => {
                        console.error("Error clearing old about content:", err);
                        res.end(JSON.stringify({ error: "Error updating about content" }));
                    });
                });
            } else {
                res.end(result);
            }
        } else {
            res.end(result);
        }
    } else if (method == "POST") {
        // Nhận dữ liệu từ Client gởi về.
        let noi_dung_nhan = "";
        req.on("data", (du_lieu) => {
            noi_dung_nhan += du_lieu;
        })

        if (url === "/api/about") {
            req.on("end", () => {
                let new_document = JSON.parse(noi_dung_nhan);
                // Xóa tất cả nội dung cũ
                db.deleteMany("about", {}).then(() => {
                    // Thêm nội dung mới
                    db.insertOne("about", new_document).then((result) => {
                        res.end(JSON.stringify({ success: true }));
                    }).catch((err) => {
                        console.error("Error updating about:", err);
                        res.end(JSON.stringify({ error: "Error updating about content" }));
                    });
                }).catch((err) => {
                    console.error("Error clearing old about content:", err);
                    res.end(JSON.stringify({ error: "Error updating about content" }));
                });
            });
        } else if (url == "/INSERT_MOBILE") {
            // Server Xử lý và Trả kết quả lại cho Client
            req.on("end", () => {
                let kq = {
                    "noi_dung": true
                }
                let new_document = JSON.parse(noi_dung_nhan);
                db.insertOne("mobile", new_document).then((result) => {
                    console.log(result)
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Insert User: ", err)
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })

            })
        } else if (url == "/INSERT_TIVI") {
            // Server Xử lý và Trả kết quả lại cho Client
            req.on("end", () => {
                let kq = {
                    "noi_dung": true
                }
                let new_document = JSON.parse(noi_dung_nhan);
                db.insertOne("tivi", new_document).then((result) => {
                    console.log(result)
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Insert User: ", err)
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })

            })
        } else if (url == "/INSERT_FOOD") {
            // Server Xử lý và Trả kết quả lại cho Client
            req.on("end", () => {
                let kq = {
                    "noi_dung": true
                }
                let new_document = JSON.parse(noi_dung_nhan);
                db.insertOne("food", new_document).then((result) => {
                    console.log(result)
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Insert User: ", err)
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })

            })
        } else if (url == "/INSERT_USER") {
            // Server Xử lý và Trả kết quả lại cho Client
            req.on("end", () => {
                let kq = {
                    "noi_dung": true
                }
                let new_document = JSON.parse(noi_dung_nhan);
                db.insertOne("user", new_document).then((result) => {
                    console.log(result)
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Insert User: ", err)
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })

            })
        } else if (url == "/INSERT_ABOUT") {
            // Server Xử lý và Trả kết quả lại cho Client
            req.on("end", () => {
                let kq = {
                    "noi_dung": true
                }
                let new_document = JSON.parse(noi_dung_nhan);
                db.insertOne("about", new_document).then((result) => {
                    console.log(result)
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Insert About: ", err)
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })

            })
        } else if (url == "/LOGIN") {
            // Server Xử lý và Trả kết quả lại cho Client
            req.on("end", () => {
                let kq = {
                    "noi_dung": true
                }
                let user = JSON.parse(noi_dung_nhan);
                let filter = {
                    $and: [
                        {
                            "Ten_Dang_nhap": user.Ten_Dang_nhap
                        },
                        {
                            "Mat_khau": user.Mat_khau
                        }
                    ]
                }
                db.getOne("user", filter).then((result) => {
                    console.log(result)
                    if (result) {
                        kq.noi_dung = {
                            Ho_ten:result.Ho_ten,
                            Nhom_Nguoi_dung: result.Nhom_Nguoi_dung
                        }
                        res.end(JSON.stringify(kq));
                    } else {
                        kq.noi_dung = false;
                        res.end(JSON.stringify(kq));
                    }

                }).catch((err) => {
                    console.error(`Error Login:`, err);
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })

                //
            })
        } else if (url == "/LIENHE") {
            req.on("end", () => {
                let thongTin = JSON.parse(noi_dung_nhan);
                let kq = { "noi_dung": true };
                let _from = "admin@shopThuTran.com.vn";
                let _to = "duytuong1731@gmail.com";
                let _subject = thongTin.tieude;
                let _body = thongTin.noidung;
                sendMail.Goi_Thu(_from, _to, _subject, _body).then((result) => {
                    console.log(result);
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.log(err)
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })
            })
        } else if (url == "/DATHANG") {
            req.on("end", () => {
                // Server xử lý dữ liệu từ Client gởi về trả kết quả về lại cho Client
                let dsDathang = JSON.parse(noi_dung_nhan);
                let kq = { "noidung": [] };
                dsDathang.forEach((item) => {
                    let filter = {
                        "Ma_so": item.key
                    }
                    let collectionName = (item.nhom == 1) ? "tivi" : (item.nhom == 2) ? "mobile" : "food";
                    db.getOne(collectionName, filter).then((result) => {

                        item.dathang.So_Phieu_Dat = result.Danh_sach_Phieu_Dat.length + 1;
                        result.Danh_sach_Phieu_Dat.push(item.dathang);
                        // Update
                        let capnhat = {
                            $set: { Danh_sach_Phieu_Dat: result.Danh_sach_Phieu_Dat }
                        }
                        let obj = {
                            "Ma_so": result.Ma_so,
                            "Update": true
                        }
                        db.updateOne(collectionName, filter, capnhat).then((result) => {
                            if (result.modifiedCount == 0) {
                                obj.Update = false

                            }
                            kq.noidung.push(obj);
                            console.log(kq.noidung)
                            if (kq.noidung.length == dsDathang.length) {
                                res.end(JSON.stringify(kq));
                            }
                        }).catch((err) => {
                            console.log(err);
                        })
                    }).catch((err) => {
                        console.log(err)
                    })

                })
            })
        } else if (url == "/UPLOAD_IMG_MOBILE") {
            req.on('end', function () {
                let img = JSON.parse(noi_dung_nhan);
                let Ket_qua = { "Noi_dung": true };
                // upload img in images Server ------------------------------
                let kq = saveMedia(img.name, img.src)
                if (kq == "OK") {
                    res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                    res.end(JSON.stringify(Ket_qua));
                }else{
                    Ket_qua.Noi_dung=false
                    res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                    res.end(JSON.stringify(Ket_qua));
                }
            })

        } else if (url == "/UPLOAD_IMG_TIVI") {
            req.on('end', function () {
                let img = JSON.parse(noi_dung_nhan);
                let Ket_qua = { "Noi_dung": true };
                // upload img in images Server ------------------------------
                let kq = saveMedia(img.name, img.src)
                if (kq == "OK") {
                    res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                    res.end(JSON.stringify(Ket_qua));
                }else{
                    Ket_qua.Noi_dung=false
                    res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                    res.end(JSON.stringify(Ket_qua));
                }
            })

        } else if (url == "/UPLOAD_IMG_FOOD") {
            req.on('end', function () {
                let img = JSON.parse(noi_dung_nhan);
                let Ket_qua = { "Noi_dung": true };
                // upload img in images Server ------------------------------
                let kq = saveMedia(img.name, img.src)
                if (kq == "OK") {
                    res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                    res.end(JSON.stringify(Ket_qua));
                }else{
                    Ket_qua.Noi_dung=false
                    res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                    res.end(JSON.stringify(Ket_qua));
                }
            })

        } else if (url == "/UPLOAD_IMG_USER") {
            req.on('end', function () {
                let img = JSON.parse(noi_dung_nhan);
                let Ket_qua = { "Noi_dung": true };
                // upload img in images Server ------------------------------
                let kq = saveMedia(img.name, img.src)
                if (kq == "OK") {
                    res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                    res.end(JSON.stringify(Ket_qua));
                }else{
                    Ket_qua.Noi_dung=false
                    res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                    res.end(JSON.stringify(Ket_qua));
                }
            })

        } else if (url == "/banners") {
            req.on("end", () => {
                let kq = {
                    "noi_dung": true
                }
                try {
                    console.log("Received data:", noi_dung_nhan); // Debug log
                    
                    // Kiểm tra xem dữ liệu có phải là JSON hợp lệ không
                    if (!noi_dung_nhan.startsWith('{')) {
                        throw new Error('Invalid JSON data');
                    }

                    // Parse dữ liệu JSON
                    const bannerData = JSON.parse(noi_dung_nhan);
                    console.log("Parsed data:", bannerData); // Debug log
                    
                    // Lưu ảnh
                    if (bannerData.image) {
                        try {
                            const base64Data = bannerData.image.replace(/^data:image\/\w+;base64,/, '');
                            const imageBuffer = Buffer.from(base64Data, 'base64');
                            const imageName = Date.now() + '.png';
                            const imagePath = `images/banners/${imageName}`;
                            
                            // Đảm bảo thư mục tồn tại
                            if (!fs.existsSync('images/banners')) {
                                fs.mkdirSync('images/banners', { recursive: true });
                            }
                            
                            // Lưu ảnh
                            fs.writeFileSync(imagePath, imageBuffer);
                            console.log('Saved image to:', imagePath); // Debug log
                            
                            // Lưu đường dẫn ảnh vào database
                            bannerData.imageUrl = `/images/banners/${imageName}`;
                        } catch (error) {
                            console.error('Error saving image:', error);
                            throw error;
                        }
                    }
                    
                    delete bannerData.image; // Xóa dữ liệu base64 sau khi đã lưu

                    db.insertOne("banners", bannerData).then((result) => {
                        console.log("Database result:", result); // Debug log
                        res.end(JSON.stringify(kq));
                    }).catch((err) => {
                        console.error("Error Insert Banner: ", err)
                        kq.noi_dung = false;
                        res.end(JSON.stringify(kq));
                    })
                } catch (error) {
                    console.error("Error processing form data:", error);
                    console.error("Raw data:", noi_dung_nhan); // Debug log
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                }
            })
        } else {
            res.end(result);
        }

    } else if (method == "PUT") {
        // Nhận dữ liệu từ Client gởi về.
        let noi_dung_nhan = "";
        req.on("data", (du_lieu) => {
            noi_dung_nhan += du_lieu;
        })
        if (url == "/UPDATE_MOBILE") {
            req.on('end', function () {
                let mobileUpdate = JSON.parse(noi_dung_nhan);
                let ket_qua = { "Noi_dung": true };
                db.updateOne("mobile",mobileUpdate.condition,mobileUpdate.update).then(result=>{
                    console.log(result);
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(ket_qua));
                }).catch(err=>{
                    console.log(err);
                    ket_qua.Noi_dung = false;
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(ket_qua)) 
                })
            })
        } else if (url == "/UPDATE_TIVI") {
            req.on('end', function () {
                let mobileUpdate = JSON.parse(noi_dung_nhan);
                let ket_qua = { "Noi_dung": true };
                db.updateOne("tivi",mobileUpdate.condition,mobileUpdate.update).then(result=>{
                    console.log(result);
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(ket_qua));
                }).catch(err=>{
                    console.log(err);
                    ket_qua.Noi_dung = false;
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(ket_qua)) 
                })
            })
        } else if (url == "/UPDATE_FOOD") {
            req.on('end', function () {
                let mobileUpdate = JSON.parse(noi_dung_nhan);
                let ket_qua = { "Noi_dung": true };
                db.updateOne("food",mobileUpdate.condition,mobileUpdate.update).then(result=>{
                    console.log(result);
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(ket_qua));
                }).catch(err=>{
                    console.log(err);
                    ket_qua.Noi_dung = false;
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(ket_qua)) 
                })
            })
        } else if (url == "/UPDATE_USER") {
            req.on('end', function () {
                let mobileUpdate = JSON.parse(noi_dung_nhan);
                let ket_qua = { "Noi_dung": true };
                db.updateOne("user",mobileUpdate.condition,mobileUpdate.update).then(result=>{
                    console.log(result);
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(ket_qua));
                }).catch(err=>{
                    console.log(err);
                    ket_qua.Noi_dung = false;
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(ket_qua)) 
                })
            })
        } else if (url == "/UPDATE_ABOUT") {
            req.on('end', function () {
                let mobileUpdate = JSON.parse(noi_dung_nhan);
                let ket_qua = { "Noi_dung": true };
                db.updateOne("about",mobileUpdate.condition,mobileUpdate.update).then(result=>{
                    console.log(result);
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(ket_qua));
                }).catch(err=>{
                    console.log(err);
                    ket_qua.Noi_dung = false;
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(ket_qua)) 
                })
            })
        } else if (url.match(/^\/banners\/[a-zA-Z0-9]+$/)) {
            const id = url.split('/')[2];
            req.on("end", () => {
                let kq = {
                    "noi_dung": true
                }
                let update_document = JSON.parse(noi_dung_nhan);
                db.updateOne("banners", { _id: id }, { $set: update_document }).then((result) => {
                    console.log(result)
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Update Banner: ", err)
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })
            })
        }
    } else if (method == "DELETE") {
        // Nhận dữ liệu từ Client gởi về.
        let noi_dung_nhan = "";
        req.on("data", (du_lieu) => {
            noi_dung_nhan += du_lieu;
        })
        if (url == "/DELETE_MOBILE") {
            // Server xử lý và trả kết quả lại client
            req.on("end", () => {
                let kq = {
                    noi_dung: true
                }
                let filter = JSON.parse(noi_dung_nhan);
                db.deleteOne("mobile", filter).then((result) => {
                    console.log(result);
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Delete Mobile", err);
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })
            })
        } else if (url == "/DELETE_TIVI") {
            // Server xử lý và trả kết quả lại client
            req.on("end", () => {
                let kq = {
                    noi_dung: true
                }
                let filter = JSON.parse(noi_dung_nhan);
                db.deleteOne("tivi", filter).then((result) => {
                    console.log(result);
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Delete Tivi", err);
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })
            })
        } else if (url == "/DELETE_FOOD") {
            // Server xử lý và trả kết quả lại client
            req.on("end", () => {
                let kq = {
                    noi_dung: true
                }
                let filter = JSON.parse(noi_dung_nhan);
                db.deleteOne("food", filter).then((result) => {
                    console.log(result);
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Delete Food", err);
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })
            })
        } else if (url == "/DELETE_USER") {
            // Server xử lý và trả kết quả lại client
            req.on("end", () => {
                let kq = {
                    noi_dung: true
                }
                let filter = JSON.parse(noi_dung_nhan);
                db.deleteOne("user", filter).then((result) => {
                    console.log(result);
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Delete Tivi", err);
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })
            })
        } else if (url == "/DELETE_ABOUT") {
            // Server xử lý và trả kết quả lại client
            req.on("end", () => {
                let kq = {
                    noi_dung: true
                }
                let filter = JSON.parse(noi_dung_nhan);
                db.deleteOne("about", filter).then((result) => {
                    console.log(result);
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Delete About", err);
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })
            })
        } else if (url.match(/^\/banners\/[a-zA-Z0-9]+$/)) {
            const id = url.split('/')[2];
            console.log('Deleting banner with ID:', id); // Debug log
            try {
                const objectId = new ObjectId(id);
                db.deleteOne("banners", { _id: objectId }).then((result) => {
                    console.log('Delete result:', result); // Debug log
                    let kq = {
                        "noi_dung": result.deletedCount > 0
                    }
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Delete Banner: ", err)
                    let kq = {
                        "noi_dung": false
                    }
                    res.end(JSON.stringify(kq));
                })
            } catch (error) {
                console.error("Invalid ObjectId:", error);
                let kq = {
                    "noi_dung": false
                }
                res.end(JSON.stringify(kq));
            }
        } else {
            res.end(result);
        }
    } else {
        res.end(result);
    }

})

server.listen(port, () => {
    console.log(`http://localhost:${port}`)
})


let decodeBase64Image=(dataString)=>{
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};

    if (matches.length !== 3) {
        return new Error('Error ...');
    }

    response.type = matches[1];
    response.data = new Buffer.from(matches[2], 'base64');

    return response;
}

let saveMedia=(Ten, Chuoi_nhi_phan)=>{
    var Kq = "OK"
    try {
        var Nhi_phan = decodeBase64Image(Chuoi_nhi_phan);
        var Duong_dan = "images//" + Ten
        fs.writeFileSync(Duong_dan, Nhi_phan.data);
    } catch (Loi) {
        Kq = Loi.toString()
    }
    return Kq
}

// Cấu hình multer cho upload ảnh
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/banners')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

