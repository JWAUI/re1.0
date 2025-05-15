document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const originalImage = document.getElementById('originalImage');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const pixelCanvas = document.getElementById('pixelCanvas');
    const pixelPlaceholder = document.getElementById('pixelPlaceholder');
    const ctx = pixelCanvas.getContext('2d');
    const pixelSizeInput = document.getElementById('pixelSize');
    const pixelSizeValue = document.getElementById('pixelSizeValue');
    const convertButton = document.getElementById('convertButton');
    const downloadLink = document.getElementById('downloadLink');
    const modeSelect = document.getElementById('modeSelect'); // 模式选择

    let currentImage = null;

    // 更新像素大小显示
    pixelSizeInput.addEventListener('input', (event) => {
        pixelSizeValue.textContent = event.target.value;
    });

    // 监听图片上传
    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                originalImage.src = e.target.result;
                originalImage.style.display = 'block';
                uploadPlaceholder.style.display = 'none';
                currentImage = new Image();
                currentImage.onload = () => {
                    console.log('图片加载成功');
                    pixelPlaceholder.style.display = 'block';
                    pixelCanvas.style.display = 'none';
                    downloadLink.style.display = 'none';
                };
                currentImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // 转换按钮点击事件
    convertButton.addEventListener('click', () => {
        if (!currentImage) {
            alert('请先上传图片！');
            return;
        }

        const mode = modeSelect.value; // 获取当前选择的模式
        const pixelSize = parseInt(pixelSizeInput.value, 10);

        if (mode === '8bit') {
            // 8位机模式处理
            const width = currentImage.width;
            const height = currentImage.height;

            pixelCanvas.width = width;
            pixelCanvas.height = height;

            ctx.clearRect(0, 0, width, height); // 清空画布
            ctx.drawImage(currentImage, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            // NES 调色板（经典 8 位机风格）
            const palette = [
                [0, 0, 0], [124, 124, 124], [188, 188, 188], [255, 255, 255],
                [252, 0, 0], [0, 252, 0], [0, 0, 252], [252, 252, 0],
                [252, 0, 252], [0, 252, 252], [252, 152, 56], [252, 116, 180],
                [116, 252, 180], [116, 180, 252], [180, 116, 252], [252, 116, 116],
                [252, 216, 168], [252, 252, 116], [168, 252, 168], [168, 252, 252],
                [116, 168, 252], [216, 116, 252], [252, 116, 216], [252, 168, 116]
            ];

            // 像素画处理逻辑
            for (let y = 0; y < height; y += pixelSize) {
                for (let x = 0; x < width; x += pixelSize) {
                    const index = (y * width + x) * 4;

                    // 获取原始颜色
                    const r = data[index];
                    const g = data[index + 1];
                    const b = data[index + 2];

                    // 找到最接近的调色板颜色
                    let closestColor = palette[0];
                    let minDistance = Infinity;
                    for (const color of palette) {
                        const distance = Math.pow(r - color[0], 2) +
                                         Math.pow(g - color[1], 2) +
                                         Math.pow(b - color[2], 2);
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestColor = color;
                        }
                    }

                    // 设置填充颜色
                    ctx.fillStyle = `rgb(${closestColor[0]}, ${closestColor[1]}, ${closestColor[2]})`;

                    // 绘制像素块
                    ctx.fillRect(x, y, pixelSize, pixelSize);
                }
            }

            pixelPlaceholder.style.display = 'none';
            pixelCanvas.style.display = 'block';
            downloadLink.style.display = 'inline-block';
        } else if (mode === 'normal') {
            // 普通模式处理：生成像素画效果（保持现有逻辑）
            const width = currentImage.width;
            const height = currentImage.height;

            pixelCanvas.width = width;
            pixelCanvas.height = height;

            ctx.clearRect(0, 0, width, height); // 清空画布
            ctx.drawImage(currentImage, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            // 像素画处理逻辑
            for (let y = 0; y < height; y += pixelSize) {
                for (let x = 0; x < width; x += pixelSize) {
                    let totalR = 0, totalG = 0, totalB = 0, totalA = 0, count = 0;

                    // 遍历像素块内的像素，计算加权平均值
                    for (let subY = 0; subY < pixelSize; subY++) {
                        for (let subX = 0; subX < pixelSize; subX++) {
                            const pixelX = x + subX;
                            const pixelY = y + subY;

                            if (pixelX < width && pixelY < height) {
                                const index = (pixelY * width + pixelX) * 4;
                                totalR += data[index];
                                totalG += data[index + 1];
                                totalB += data[index + 2];
                                totalA += data[index + 3];
                                count++;
                            }
                        }
                    }

                    // 计算平均颜色
                    const avgR = Math.round(totalR / count);
                    const avgG = Math.round(totalG / count);
                    const avgB = Math.round(totalB / count);
                    const avgA = Math.round(totalA / count);

                    // 颜色简化：将 RGB 值限制到 64 的倍数
                    const simplifiedR = Math.round(avgR / 64) * 64;
                    const simplifiedG = Math.round(avgG / 64) * 64;
                    const simplifiedB = Math.round(avgB / 64) * 64;

                    // 设置填充颜色（保留透明度）
                    ctx.fillStyle = `rgba(${simplifiedR}, ${simplifiedG}, ${simplifiedB}, ${avgA / 255})`;

                    // 绘制像素块
                    ctx.fillRect(x, y, pixelSize, pixelSize);
                }
            }

            pixelPlaceholder.style.display = 'none';
            pixelCanvas.style.display = 'block';
            downloadLink.style.display = 'inline-block';
        } else if (mode === '16bit') {
            // 16位机模式处理（待实现）
            alert('16位机模式处理功能尚未实现！');
        }
    });

    // 下载按钮点击事件
    downloadLink.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'pixelated-image.png';
        link.href = pixelCanvas.toDataURL();
        link.click();
    });
});