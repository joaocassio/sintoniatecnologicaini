document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById('fileInput');
    const fileLabel = document.getElementById('fileLabel');
    const btnProcess = document.getElementById('btnProcess');

    if (fileInput) {
        fileInput.addEventListener("change", updateFileLabel);
    }

    if (btnProcess) {
        btnProcess.addEventListener("click", processFiles);
    }

    function updateFileLabel() {
        if (fileInput.files.length > 0) {
            fileLabel.textContent = `${fileInput.files.length} arquivos selecionados`;
        } else {
            fileLabel.textContent = 'Nenhum arquivo selecionado';
        }
    }

    

    function updateTeamTable(teamData) {
        const tableBody = document.querySelector('#resultTable tbody');
        tableBody.innerHTML = '';

        const sortedTeams = Object.keys(teamData).map(name => ({
            name,
            ...teamData[name]
        })).sort((a, b) => {
            if (b.totalScore === a.totalScore) {
                return b.kills - a.kills;
            }
            return b.totalScore - a.totalScore;
        });

        let position = 1;
        sortedTeams.forEach(team => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${position++}</td>
                <td>${team.name}</td>
                <td>${team.kills}</td>
                <td>${team.totalScore}</td>
                <td>${team.booyah}</td>
            `;
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
            row.innerHTML = `
                <td>${position++}</td>
                <td>${player.name}</td>
                <td>${player.kills}</td>
            `;
            tableBody.appendChild(row);
        });

        document.getElementById('playerTable').classList.remove('hidden');
    }

    window.exportToExcel = function () {
        const wb = XLSX.utils.book_new();
        wb.Props = {
            Title: "Resultados",
            Subject: "Resultados",
            Author: "Sintonia Tecnológica",
            CreatedDate: new Date()
        };

        const teamTable = document.getElementById('resultTable');
        const teamData = Array.from(teamTable.querySelectorAll('tr')).map(row =>
            Array.from(row.querySelectorAll('td,th')).map(cell => cell.textContent));
        const teamSheet = XLSX.utils.aoa_to_sheet(teamData);
        XLSX.utils.book_append_sheet(wb, teamSheet, "Equipes");

        const playerTable = document.getElementById('playerTable');
        const playerData = Array.from(playerTable.querySelectorAll('tr')).map(row =>
            Array.from(row.querySelectorAll('td,th')).map(cell => cell.textContent));
        const playerSheet = XLSX.utils.aoa_to_sheet(playerData);
        XLSX.utils.book_append_sheet(wb, playerSheet, "Jogadores");

        XLSX.writeFile(wb, "resultados.xlsx");
    };

    window.copyTable = function (tableId) {
        const table = document.getElementById(tableId);
        const range = document.createRange();
        range.selectNode(table);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        try {
            document.execCommand('copy');
            alert('Tabela copiada para a área de transferência!');
        } catch (err) {
            alert('Falha ao copiar a tabela.');
        }
        window.getSelection().removeAllRanges();
    };
});
function processFiles() {
        const files = fileInput.files;
        if (files.length === 0) {
            alert('Por favor, selecione um ou mais arquivos.');
            return;
        }

        const teamData = {};
        const playerData = {};

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function (event) {
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
                        teamData[name].kills += parseInt(kills);
                        teamData[name].totalScore += parseInt(totalScore);
                        teamData[name].booyah += parseInt(rank) === 1 ? 1 : 0;
                    }

                    const playerMatch = line.match(/^NAME:\s*(.+?)\s+ID:\s*\d+\s+KILL:\s*(\d+)$/);
                    if (playerMatch) {
                        const [_, playerName, kills] = playerMatch;
                        if (!playerData[playerName]) {
                            playerData[playerName] = 0;
                        }
                        playerData[playerName] += parseInt(kills);
                    }
                });

                updateTeamTable(teamData);
                updatePlayerTable(playerData);
            };
            reader.readAsText(file);
        });
    }
