package com.example.brainstorm.repository;

import com.example.brainstorm.entity.SugestaoNome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SugestaoRepository extends JpaRepository<SugestaoNome, Long> {

    // Ordenação padrão por votos descendente
    List<SugestaoNome> findAllByOrderByVotosDesc();

    // Filtro para domínio .com disponível
    List<SugestaoNome> findByDominioComDisponivelTrueOrderByVotosDesc();

    // Filtro para domínio .com.br disponível
    List<SugestaoNome> findByDominioComBrDisponivelTrueOrderByVotosDesc();

    // Filtro para ausência de conflitos de marca
    List<SugestaoNome> findByConflitosMarcaEqualsOrderByVotosDesc(int conflitos);

    // Ordenação por mais recentes
    List<SugestaoNome> findAllByOrderByCreatedAtDesc();
}
