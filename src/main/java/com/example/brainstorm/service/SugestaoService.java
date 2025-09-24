package com.example.brainstorm.service;

import com.example.brainstorm.entity.SugestaoNome;
import com.example.brainstorm.repository.SugestaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
public class SugestaoService {

    private final SugestaoRepository sugestaoRepository;
    private final Random random = new Random();

    @Autowired
    public SugestaoService(SugestaoRepository sugestaoRepository) {
        this.sugestaoRepository = sugestaoRepository;
    }

    /**
     * Retorna todas as sugestões, ordenadas por votos em ordem decrescente.
     */
    public List<SugestaoNome> findAllOrderByVotos() {
        return sugestaoRepository.findAllByOrderByVotosDesc();
    }

    /**
     * Cria e salva uma nova sugestão com valores aleatórios para disponibilidade.
     * @param nomeSugestao O nome da sugestão.
     * @param autor O nome do autor da sugestão.
     */
    public void save(String nomeSugestao, String autor) {
        SugestaoNome novaSugestao = new SugestaoNome();
        novaSugestao.setNome(nomeSugestao);
        novaSugestao.setAutor(autor);
        novaSugestao.setVotos(0);
        novaSugestao.setCreatedAt(LocalDateTime.now());

        // Simula a verificação de domínio e INPI com valores aleatórios
        novaSugestao.setDominioDisponivel(random.nextBoolean());
        novaSugestao.setInpiDisponivel(random.nextBoolean());

        sugestaoRepository.save(novaSugestao);
    }

    /**
     * Incrementa o número de votos de uma sugestão.
     * @param id O ID da sugestão a ser votada.
     */
    @Transactional
    public void upvote(Long id) {
        SugestaoNome sugestao = sugestaoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sugestão não encontrada com o id: " + id));
        sugestao.setVotos(sugestao.getVotos() + 1);
        sugestaoRepository.save(sugestao);
    }

    /**
     * Decrementa o número de votos de uma sugestão.
     * @param id O ID da sugestão a ser votada.
     */
    @Transactional
    public void downvote(Long id) {
        SugestaoNome sugestao = sugestaoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sugestão não encontrada com o id: " + id));
        sugestao.setVotos(sugestao.getVotos() - 1);
        sugestaoRepository.save(sugestao);
    }

    /**
     * Retorna uma lista de sugestões baseada no critério de filtro.
     * @param filter O critério de filtro ("domain", "inpi", "recent").
     * @return A lista de sugestões filtrada e ordenada.
     */
    public List<SugestaoNome> getFilteredSuggestions(String filter) {
        return switch (filter) {
            case "domain" -> sugestaoRepository.findByDominioDisponivelTrueOrderByVotosDesc();
            case "inpi" -> sugestaoRepository.findByInpiDisponivelTrueOrderByVotosDesc();
            case "recent" -> sugestaoRepository.findAllByOrderByCreatedAtDesc();
            default -> findAllOrderByVotos();
        };
    }
}
