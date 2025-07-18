// script.js atualizado para integração com Supabase

const supabaseUrl = 'https://tuirpknvxiyukailjqod.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1aXJwa252eGl5dWthaWxqcW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTAyMzMsImV4cCI6MjA2ODEyNjIzM30.5iywisKkY-2UVKHPXKhthyX72E1oz2onteyl6egFBjg';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

function updateFileLabel() {
    const input = document.getElementById('fileInput');
    const fileLabel = document.getElementById('fileLabel');
    if (input.files.length > 0) {
        fileLabel.textContent = `${input.files.length} arquivos selecionados`;
    } else {
        fileLabel.textContent = 'Nenhum arquivo selecionado';
    }
}

function getEventoIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("evento");
}

function processFiles() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    if (files.length === 0) {
        alert('Por favor, selecione um ou mais arquivos.');
        return;
    }

    const eventoId = getEventoIdFromURL();
    if (!eventoId) {
        alert("ID do evento não encontrado na URL.");
        return;
    }

    const teamData = {};
    const playerData = {};
    let registrosParaEnviar = [];

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = async function(event) {
            const content = event.target.result;
            const lines = content.split('\n');

            lines.forEach(line => {
                line = line.trim();

                const teamMatch = line.match(/^TeamName:\s*(.+?)\s+Rank:\s*(\d+)\s+KillScore:\s*(\d+)\s+RankScore:\s*(\d+)\s+TotalScore:\s*(\d+)$/);
                if (teamMatch) {
                    const [_, name, rank, kills, rankScore, totalScore] = teamMatch;
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

                    registrosParaEnviar.push({
                        evento_id: eventoId,
                        team_name: name,
                        kills: parseInt(kills),
                        total_score: parseInt(totalScore),
                        booyah: (parseInt(rank) === 1),
                        raw: line
                    });
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

            updateTeamTable(teamData);
            updatePlayerTable(playerData);

            if (registrosParaEnviar.length > 0) {
                const { error } = await supabase.from("logs").insert(registrosParaEnviar);
                if (error) {
                    console.error("Erro ao enviar logs:", error);
                    alert("Erro ao enviar logs para o Supabase.");
                } else {
                    alert("Logs enviados e processados com sucesso!");
                }
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
    const teamTable = document.getElementById('resultTable');
    const teamData = Array.from(teamTable.querySelectorAll('tr')).map(row => Array.from(row.querySelectorAll('td, th')).map(cell => cell.textContent));
    const teamWs = XLSX.utils.aoa_to_sheet(teamData);
    XLSX.utils.book_append_sheet(wb, teamWs, "Equipes");

    const playerTable = document.getElementById('playerTable');
    const playerData = Array.from(playerTable.querySelectorAll('tr')).map(row => Array.from(row.querySelectorAll('td, th')).map(cell => cell.textContent));
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
