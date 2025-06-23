import React, { useEffect, useState } from 'react';
import { fetchRankingData, RankingUser } from '../services/rankingService';
import './RankingPage.css'; // Criaremos este arquivo para estilos

const RankingPage: React.FC = () => {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRanking = async () => {
      try {
        setLoading(true);
        setError(null);
        const rankingData = await fetchRankingData(50); // Pega top 50
        setRanking(rankingData);
      } catch (err) {
        console.error("Falha ao carregar ranking:", err);
        setError("Não foi possível carregar o ranking. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    loadRanking();
  }, []);

  if (loading) {
    return <div className="ranking-loading">Carregando Ranking...</div>;
  }

  if (error) {
    return <div className="ranking-error">Erro: {error}</div>;
  }

  return (
    <div className="ranking-page-container">
      <h2 className="ranking-title">Ranking de Jogadores</h2>
      {ranking.length === 0 ? (
        <p className="no-ranking-data">Nenhum dado de ranking disponível ainda.</p>
      ) : (
        <div className="ranking-table-wrapper">
          <table className="ranking-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Jogador</th>
                <th>Vitórias</th>
                <th>Derrotas</th>
                <th>Partidas</th>
                <th>Aproveitamento</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((user, index) => {
                let positionClass = "";
                if (index === 0) positionClass = "gold-rank";
                else if (index === 1) positionClass = "silver-rank";
                else if (index === 2) positionClass = "bronze-rank";

                return (
                  <tr key={user.id} className={positionClass}>
                    <td className={`ranking-position ${positionClass}`}>{index + 1}</td>
                    <td className="ranking-name">{user.username}</td>
                    <td className="ranking-stats">{user.wins}</td>
                    <td className="ranking-stats">{user.losses}</td>
                    <td className="ranking-stats">{user.matches}</td>
                    <td className="ranking-stats win-rate">{user.winRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RankingPage;
