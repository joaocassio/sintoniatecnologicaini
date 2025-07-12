        // Atualiza o rótulo do arquivo exibido
        function updateFileLabel() {
            const input = document.getElementById('fileInput');
            const fileLabel = document.getElementById('fileLabel');

            if (input.files.length > 0) {
                fileLabel.textContent = `${input.files.length} arquivos selecionados`;
            } else {
                fileLabel.textContent = 'Nenhum arquivo selecionado';
            }
        }

        function processFiles() {
            const fileInput = document.getElementById('fileInput');
            const files = fileInput.files;
            if (files.length === 0) {
                alert('Por favor, selecione um ou mais arquivos.');
                return;
            }

            const teamData = {};
            const playerData = {};

            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const content = event.target.result;
                    const lines = content.split('\n');

                    lines.forEach(line => {
                        line = line.trim();
                        console.log('Processing line:', line); // Log para depuração

                        // Processamento dos dados das equipes
                        const teamNameMatch = line.match(/^TeamName:\s*(.+?)\s+Rank:\s*(\d+)\s+KillScore:\s*(\d+)\s+RankScore:\s*(\d+)\s+TotalScore:\s*(\d+)$/);
                        if (teamNameMatch) {
                            const [_, name, rank, kills, rankScore, totalScore] = teamNameMatch;
                            if (!teamData[name]) {
                                teamData[name] = {
                                    kills: 0,
                                    totalScore: 0,
                                    booyah: 0
                                };
                            }
                            teamData[name].kills += parseInt(kills, 10);
                            teamData[name].totalScore += parseInt(totalScore, 10);
                            teamData[name].booyah += (parseInt(rank, 10) === 1) ? 1 : 0;
                        }

                        // Processamento dos dados dos jogadores
                        const playerNameMatch = line.match(/^NAME:\s*(.+?)\s+ID:\s*\d+\s+KILL:\s*(\d+)$/);
                        if (playerNameMatch) {
                            const [_, playerName, kills] = playerNameMatch;
                            if (!playerData[playerName]) {
                                playerData[playerName] = 0;
                            }
                            playerData[playerName] += parseInt(kills, 10);
                        }
                    });

                    // Atualiza a tabela de equipes
                    updateTeamTable(teamData);
                    // Atualiza a tabela de jogadores
                    updatePlayerTable(playerData);
                };
                reader.readAsText(file);
            });
        }

        function updateTeamTable(teamData) {
            const tableBody = document.querySelector('#resultTable tbody');
            tableBody.innerHTML = '';

            const sortedTeams = Object.keys(teamData).map(team => ({
                name: team,
                ...teamData[team]
            })).sort((a, b) => {
                if (b.totalScore === a.totalScore) {
                    return b.kills - a.kills;
                }
                return b.totalScore - a.totalScore;
            });

            let position = 1;
            sortedTeams.forEach(team => {
                const { name, kills, totalScore, booyah } = team;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${position++}</td>
                    <td>${name}</td>
                    <td>${kills}</td>
                    <td>${totalScore}</td>
                    <td>${booyah}</td>
                `;
                tableBody.appendChild(row);
            });

            document.getElementById('resultTable').classList.remove('hidden');
        }

        function updatePlayerTable(playerData) {
            const tableBody = document.querySelector('#playerTable tbody');
            tableBody.innerHTML = '';

            const sortedPlayers = Object.keys(playerData).map(player => ({
                name: player,
                kills: playerData[player]
            })).sort((a, b) => b.kills - a.kills);

            let position = 1;
            sortedPlayers.forEach(player => {
                const { name, kills } = player;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${position++}</td>
                    <td>${name}</td>
                    <td>${kills}</td>
                `;
                tableBody.appendChild(row);
            });

            document.getElementById('playerTable').classList.remove('hidden');
        }

        function exportToExcel() {
            const wb = XLSX.utils.book_new();
            wb.Props = {
                Title: "Resultados",
                Subject: "Resultados",
                Author: "Autor",
                CreatedDate: new Date()
            };

            // Adiciona a tabela de equipes
            const teamTable = document.getElementById('resultTable');
            const teamData = Array.from(teamTable.querySelectorAll('tr')).map(row => Array.from(row.querySelectorAll('td')).map(cell => cell.textContent));
            const teamWs = XLSX.utils.aoa_to_sheet(teamData);
            XLSX.utils.book_append_sheet(wb, teamWs, "Equipes");

            // Adiciona a tabela de jogadores
            const playerTable = document.getElementById('playerTable');
            const playerData = Array.from(playerTable.querySelectorAll('tr')).map(row => Array.from(row.querySelectorAll('td')).map(cell => cell.textContent));
            const playerWs = XLSX.utils.aoa_to_sheet(playerData);
            XLSX.utils.book_append_sheet(wb, playerWs, "Jogadores");

            XLSX.writeFile(wb, "resultados.xlsx");
        }

        function copyTable(tableId) {
            const table = document.getElementById(tableId);
            const range = document.createRange();
            range.selectNode(table);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            try {
                document.execCommand('copy');
                alert('Tabela copiada para a área de transferência!');
            } catch (err) {
                alert('Falha ao copiar tabela.');
            }
            window.getSelection().removeAllRanges();
        }

// Funções de criptografia básica (não é segurança forte, mas dificulta)
function x1y2z3(texto) {
    return btoa(unescape(encodeURIComponent(texto)));
}

function z3y2x1(texto) {
    return decodeURIComponent(escape(atob(texto)));
}

// Dados ofuscados
var dadosSistema = {
    chave1: "ZmVyYQ==", 
    chave2: "Y29ycmV0b0FjZXNz", 
    tempo: 86400000 // 1 dia em ms
};

function verificarAcesso() {
            var entrada = document.getElementById('acessoCodigo').value;
            var codigoValido = z3y2x1(dadosSistema.chave1);
            
            if (entrada === codigoValido) {
                document.getElementById('loginModal').style.display = 'none';
                localStorage.setItem(dadosSistema.chave2, 'true');
                // Mostra a tag premium
                document.getElementById('premiumTag').style.display = 'block';
            } else {
                alert("Código inválido!");
            }
        }

// Verificação ao carregar
window.onload = function() {
    var tempoAtual = new Date().getTime();
    var tempoExpiracao = localStorage.getItem('tempoAcesso');
    var estaAutenticado = localStorage.getItem(dadosSistema.chave2) === 'true';
    
    // Verifica expiração primeiro
    if (tempoExpiracao && tempoAtual > tempoExpiracao) {
        localStorage.removeItem(dadosSistema.chave2);
        localStorage.removeItem('tempoAcesso');
        estaAutenticado = false; // Atualiza o status
    }
    
    // Depois verifica autenticação
    if (!estaAutenticado) {
        document.getElementById('loginModal').style.display = 'flex';
        document.getElementById('premiumTag').style.display = 'none';
    } else {
        document.getElementById('premiumTag').style.display = 'block';
        document.getElementById('loginModal').style.display = 'none';
    }
};

// Proteção adicional contra inspeção
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

var teclasBloqueadas = ['F12', 'F5', 'F11'];
document.addEventListener('keydown', function(e) {
    if (teclasBloqueadas.includes(e.key) || 
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
        (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
        alert("Acesso negado");
    }
});
