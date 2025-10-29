// Armazena os objetos de arquivo (File)
let selectedFiles = [];

const fileInput = document.getElementById('fileInput');
const dropArea = document.getElementById('drop-area');
const fileListDiv = document.getElementById('fileList');
const statusDiv = document.getElementById('status');

// --- Funções da Interface ---

// Abre a janela de seleção de arquivos ao clicar na área de arrastar
dropArea.addEventListener('click', () => fileInput.click());

// Evento disparado ao selecionar arquivos pelo botão
fileInput.addEventListener('change', (e) => {
    addFiles(e.target.files);
});

// Eventos de Arrastar e Soltar (Drag and Drop)
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.style.borderColor = '#4a9435', false);
});
['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.style.borderColor = '#60BB46', false);
});
dropArea.addEventListener('drop', handleDrop, false);

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    let dt = e.dataTransfer;
    let files = dt.files;
    addFiles(files);
}

function addFiles(files) {
    // Aceita PDF, JPG/JPEG e PNG
    const allowedExtensions = ['application/pdf', 'image/jpeg', 'image/png'];
    const validFiles = Array.from(files).filter(file => allowedExtensions.includes(file.type));
    
    // Adiciona os novos arquivos ao final da lista existente
    selectedFiles = [...selectedFiles, ...validFiles];
    updateFileList();
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
}

function updateFileList() {
    fileListDiv.innerHTML = '';
    
    // ATUALIZA CONTAGEM NO TÍTULO
    document.getElementById('fileCount').textContent = selectedFiles.length;

    if (selectedFiles.length === 0) {
        fileListDiv.innerHTML = '<div style="text-align: center; color: #777;">Nenhum arquivo selecionado.</div>';
        return;
    }

    selectedFiles.forEach((file, index) => {
        const type = file.type.includes('pdf') ? ' (PDF)' : 
                     file.type.includes('jpeg') || file.type.includes('png') ? ' (IMAGEM)' : ' (Desconhecido)';
        const div = document.createElement('div');
        div.innerHTML = `
            <span>${index + 1}. ${file.name} ${type} (${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            <button class="btn btn-remove" onclick="removeFile(${index})">Remover</button>
        `;
        fileListDiv.appendChild(div);
    });
}

// Inicializa a lista
updateFileList();

// --- Função Principal de Mesclagem ---

async function mergePDFs() {
    // Reseta a mensagem de status
    statusDiv.textContent = 'Processando... Por favor, aguarde.';
    statusDiv.classList.remove('success-message'); 

    if (selectedFiles.length < 1) {
        statusDiv.textContent = 'Por favor, selecione pelo menos um arquivo (PDF ou Imagem).';
        return;
    }

    try {
        // 1. Cria um novo documento PDF vazio para a mesclagem
        const mergedPdf = await PDFLib.PDFDocument.create();

        // 2. Itera sobre os arquivos selecionados
        for (const file of selectedFiles) {
            const fileBytes = await file.arrayBuffer();

            if (file.type === 'application/pdf') {
                // --- Caso 1: O arquivo é um PDF (Copia todas as páginas) ---
                const pdfDoc = await PDFLib.PDFDocument.load(fileBytes);
                const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                copiedPages.forEach(page => mergedPdf.addPage(page));

            } else if (file.type.startsWith('image/')) {
                // --- Caso 2: O arquivo é uma Imagem (Cria nova página e desenha a imagem) ---
                
                let image;
                
                // Carrega a imagem com base no tipo
                if (file.type === 'image/jpeg') {
                    image = await mergedPdf.embedJpg(fileBytes);
                } else if (file.type === 'image/png') {
                    image = await mergedPdf.embedPng(fileBytes);
                } else {
                    console.warn(`Formato de imagem não suportado e ignorado: ${file.name}`);
                    continue; 
                }

                // Cria uma nova página (tamanho A4 padrão)
                const page = mergedPdf.addPage();
                
                const { width: pageWidth, height: pageHeight } = page.getSize();
                const imageDims = image.scale(1); 
                
                let renderWidth, renderHeight, x, y;
                
                // Calcula o escalonamento para caber na página (mantendo a proporção)
                const ratio = Math.min(
                    (pageWidth - 40) / imageDims.width, // -40 para margem de 20 pontos
                    (pageHeight - 40) / imageDims.height 
                );

                renderWidth = imageDims.width * ratio;
                renderHeight = imageDims.height * ratio;
                
                // Centraliza a imagem na página
                x = (pageWidth / 2) - (renderWidth / 2);
                y = (pageHeight / 2) - (renderHeight / 2);

                // Desenha a imagem na página
                page.drawImage(image, {
                    x,
                    y,
                    width: renderWidth,
                    height: renderHeight,
                });
            }
        }

        // 3. Salva o novo PDF mesclado
        const mergedPdfBytes = await mergedPdf.save();

        // 4. Cria o link de download
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // --- NOVO: Obtém o nome do arquivo do campo de texto ---
        const preferredName = document.getElementById('fileNameInput').value.trim();
        
        let finalFileName;
        
        if (preferredName) {
            // Se o usuário digitou algo, usa o nome + .pdf
            finalFileName = preferredName.replace(/[^a-z0-9_\-]/gi, '_') + '.pdf';
        } else {
            // Se estiver vazio, usa o nome padrão com a data
            finalFileName = 'junto_pdf_imagem_' + new Date().toLocaleDateString('pt-BR').replace(/\//g, '-') + '.pdf';
        }
        // --- FIM NOVO ---

        link.href = url;
        link.download = finalFileName; // Usa o nome final calculado
        
        // Simula um clique para iniciar o download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); 

        // Mensagem de Sucesso (Fica verde)
        statusDiv.textContent = `Sucesso! O arquivo ${link.download} foi baixado.`;
        statusDiv.classList.add('success-message');

        } catch (error) {
        console.error("Erro ao juntar os arquivos:", error);
        // Mensagem de Erro (Fica vermelha)
        statusDiv.textContent = 'Ocorreu um erro ao juntar os arquivos. Verifique se todos os arquivos são válidos.';
        statusDiv.classList.remove('success-message');
    }
}