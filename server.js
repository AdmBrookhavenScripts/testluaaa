const express = require("express");
const multer = require("multer");
const archiver = require("archiver");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const upload = multer({
    dest: "uploads/"
});

function runLua(input, output) {
    return new Promise((resolve, reject) => {
        execFile(
    "lua",
    [
        "lua2rbxmxv2.lua",
        input,
        output
    ],
    { stdio: "ignore", maxBuffer: 1024 * 1024 * 50 },
            (err) => {
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

function runAnim(input, output) {
    return new Promise((resolve, reject) => {
        execFile(
    "python3",
    [
        "rbxm2anim.py",
        input,
        output
    ],
    { stdio: "ignore", maxBuffer: 1024 * 1024 * 50 },
            (err) => {
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

function runAnimInfo(input) {
    return new Promise((resolve, reject) => {
        execFile(
            "python3",
            [
                "animinfo.py",
                input
            ],
            {
                stdio: "pipe",
                maxBuffer: 1024 * 1024 * 10
            },
            (err, stdout) => {
                if (err) return reject(err);
                resolve(stdout.trim());
            }
        );
    });
}

app.post(
    "/convert",
    upload.array("files"),
    async (req, res) => {

        const format =
            req.body.format || "rbxmx";

        const outputs = [];

        try {

            for (const file of req.files) {

                const baseName = path.parse(file.originalname).name;
                const ext = path.extname(file.originalname).toLowerCase();

                if (format === "anim") {

                    const animPath =
                        `temp_${Date.now()}_${Math.random()
                            .toString(36)
                            .slice(2)}.anim`;

                    if (ext === ".rbxm" || ext === ".rbxmx") {

                        await runAnim(
                            file.path,
                            animPath
                        );

                    } else {

                        const rbxmxPath =
                            `temp_${Date.now()}_${Math.random()
                                .toString(36)
                                .slice(2)}.rbxmx`;

                        await runLua(
                            file.path,
                            rbxmxPath
                        );

                        await runAnim(
                            rbxmxPath,
                            animPath
                        );

                        try {
                            fs.unlinkSync(rbxmxPath);
                        } catch {}
                    }

                    outputs.push({
                        path: animPath,
                        name: baseName + ".anim"
                    });

                } else {

    if (ext !== "" && ext !== ".lua") {

        try {
            fs.unlinkSync(file.path);
        } catch {}

        return res
            .status(400)
            .send(
                "Only .lua files can be converted to RBXMX"
            );
    }

    const rbxmxPath =
        `temp_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}.rbxmx`;

    await runLua(
        file.path,
        rbxmxPath
    );

    outputs.push({
        path: rbxmxPath,
        name: baseName + ".rbxmx"
    });
}

                try {
                    fs.unlinkSync(file.path);
                } catch {}
            }

            if (outputs.length === 1) {

                const output =
                    outputs[0];

                return res.download(
                    output.path,
                    output.name,
                    () => {
                        try {
                            fs.unlinkSync(
                                output.path
                            );
                        } catch {}
                    }
                );
            }

            const zipName =
                `animconvert_${Date.now()}.zip`;

            res.setHeader(
                "Content-Type",
                "application/zip"
            );

            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${zipName}"`
            );

            const archive =
                archiver("zip");

            archive.pipe(res);

            for (const file of outputs) {

                archive.file(
                    file.path,
                    {
                        name: file.name
                    }
                );
            }

            archive.finalize();

            archive.on("end", () => {

                for (const file of outputs) {

                    try {
                        fs.unlinkSync(
                            file.path
                        );
                    } catch {}
                }
            });

        } catch (err) {

            console.error(err);

            for (const file of outputs) {
                try {
                    fs.unlinkSync(file.path);
                } catch {}
            }

            return res
                .status(500)
                .send(err.toString());
        }
    }
);

app.post(
    "/anim-info",
    upload.array("files"),
    async (req, res) => {

        const results = [];

        try {

            for (const file of req.files) {

                if (
                    path.extname(
                        file.originalname
                    ).toLowerCase() !== ".anim"
                ) {

                    try {
                        fs.unlinkSync(file.path);
                    } catch {}

                    return res
                        .status(400)
                        .send(
                            "Only .anim files are allowed"
                        );
                }

                const output =
                    await runAnimInfo(
                        file.path
                    );

                let name = "";
                let duration = "";

                const lines =
                    output.split("\n");

                for (const line of lines) {

                    if (
                        line.startsWith(
                            "Name:"
                        )
                    ) {
                        name =
                            line
                                .replace(
                                    "Name:",
                                    ""
                                )
                                .trim();
                    }

                    if (
                        line.startsWith(
                            "Duration:"
                        )
                    ) {
                        duration =
                            line
                                .replace(
                                    "Duration:",
                                    ""
                                )
                                .trim();
                    }
                }

                results.push({
                    file:
                        file.originalname,
                    name,
                    duration
                });

                try {
                    fs.unlinkSync(
                        file.path
                    );
                } catch {}
            }

            res.json(results);

        } catch (err) {

            console.error(err);

            res
                .status(500)
                .send(
                    err.toString()
                );
        }
    }
);

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(
        `Online on port ${PORT}`
    );
});
