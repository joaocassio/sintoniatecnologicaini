document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
    }
});

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
    console.log("ProcessFiles chamado!");
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
        alert('Por favor, selecione um ou mais arquivos.');
        return;
    }
    document.getElementById('popupModal').style.display = 'block';
}

function closePopup() {
    document.getElementById('popupModal').style.display = 'none';
}

function closePopupAndProcess() {
    document.getElementById('popupModal').style.display = 'none';
    startProcessing();
}

function startProcessing() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    
    const teamData = {};
    const playerData = {};
    let filesProcessed = 0;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const content = event.target.result;
            const lines = content.split('\n');

            lines.forEach(line => {
                line = line.trim();
                const teamMatch = line.match(/^TeamName:\s*(.+?)\s+Rank:\s*(\d+)\s+KillScore:\s*(\d+)\s+RankScore:\s*(\d+)\s+TotalScore:\s*(\d+)$/);
                if (teamMatch) {
                    const [_, name, rank, kills, _, totalScore] = teamMatch;
                    if (!teamData[name]) {
                        teamData[name] = { kills: 0, totalScore: 0, booyah: 0 };
                    }
                    teamData[name].kills += parseInt(kills, 10);
                    teamData[name].totalScore += parseInt(totalScore, 10);
                    teamData[name].booyah += (parseInt(rank, 10) === 1 ? 1 : 0;
                }

                const playerMatch = line.match(/^NAME:\s*(.+?)\s+ID:\s*\d+\s+KILL:\s*(\d+)$/);
                if (playerMatch) {
                    const [_, playerName, kills] = playerMatch;
                    if (!playerData[playerName]) {
                        playerData[playerName] = 0;
                    }
                    playerData[playerName] += parseInt(kills, 10);
                }
            });

            filesProcessed++;
            if (filesProcessed === files.length) {
                updateTeamTable(teamData);
                updatePlayerTable(playerData);
            }
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
        row.innerHTML = `<td>${position++}</td><td>${name}</td><td>${kills}</td><td>${totalScore}</td><td>${booyah}</td>`;
        tableBody.appendChild(row);
    });

    document.getElementById('resultTable').classList.remove('hidden');
}

function updatePlayerTable(playerData) {
    const tableBody = document.querySelector('#playerTable tbody');
    tableBody.innerHTML = '';

    const sortedPlayers = Object.keys(playerData).map(name => ({
        name,
        kills: playerData[name]
    })).sort((a, b) => b.kills - a.kills);

    let position = 1;
    sortedPlayers.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${position++}</td><td>${player.name}</td><td>${player.kills}</td>`;
        tableBody.appendChild(row);
    });

    document.getElementById('playerTable').classList.remove('hidden');
}

function exportToExcel() {
    const wb = XLSX.utils.book_new();
    const teamTable = document.getElementById('resultTable');
    const teamData = Array.from(teamTable.querySelectorAll('tr')).map(row => Array.from(row.querySelectorAll('td, th')).map(cell => cell.textContent));
    const teamWs = XLSX.utils.aoa_to_sheet(teamData);
    XLSX.utils.book_append_sheet(wb, teamWs, 'Equipes');

    const playerTable = document.getElementById('playerTable');
    const playerData = Array.from(playerTable.querySelectorAll('tr')).map(row => Array.from(row.querySelectorAll('td, th')).map(cell => cell.textContent));
    const playerWs = XLSX.utils.aoa_to_sheet(playerData);
    XLSX.utils.book_append_sheet(wb, playerWs, 'Jogadores');

    XLSX.writeFile(wb, 'resultados.xlsx');
}

function copyTable(id) {
    const table = document.getElementById(id);
    const range = document.createRange();
    range.selectNode(table);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    try {
        document.execCommand('copy');
        alert('Tabela copiada para a área de transferência!');
    } catch {
        alert('Erro ao copiar.');
    }
    window.getSelection().removeAllRanges();
}

// Adicione isto no FINAL do arquivo script.js
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('copyTeamsBtn').addEventListener('click', function() {
        copyTable('resultTable');
    });
    
    document.getElementById('copyPlayersBtn').addEventListener('click', function() {
        copyTable('playerTable');
    });
    
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
    
    console.log("Event listeners configurados!");
});
