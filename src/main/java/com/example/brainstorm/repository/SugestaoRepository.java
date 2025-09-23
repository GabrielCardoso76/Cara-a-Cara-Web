package com.example.brainstorm.repository;

import com.example.brainstorm.entity.SugestaoNome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SugestaoRepository extends JpaRepository<SugestaoNome, Long> {

    // Ordenação padrão por votos descendente
    List<SugestaoNome> findAllByOrderByVotosDesc();

    // Filtro para domínio disponível, ordenado por votos
    List<SugestaoNome> findByDominioDisponivelTrueOrderByVotosDesc();

    // Filtro para INPI disponível, ordenado por votos
    List<SugestaoNome> findByInpiDisponivelTrueOrderByVotosDesc();

    // Ordenação por mais recentes
    List<SugestaoNome> findAllByOrderByCreatedAtDesc();
}
