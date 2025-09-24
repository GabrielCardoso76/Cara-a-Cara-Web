package com.example.brainstorm.service;

import com.example.brainstorm.entity.SugestaoNome;
import com.example.brainstorm.repository.SugestaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

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
        novaSugestao.setDominioComDisponivel(random.nextBoolean());
        novaSugestao.setDominioComBrDisponivel(random.nextBoolean());

        int totalConflitos = random.nextInt(10); // 0 a 9 conflitos
        int conflitosTecnologia = 0;
        String nomesConflitantes = "";

        if (totalConflitos > 0) {
            conflitosTecnologia = random.nextInt(totalConflitos + 1); // 0 a totalConflitos

            // Simula nomes de empresas conflitantes
            List<String> fakeCompanyNames = Arrays.asList("Innovate Inc.", "Tech Solutions", "Global Corp", "Future Systems", "Data Dynamics", "Synergy Group", "Alpha Omega", "Quantum Leap");
            Collections.shuffle(fakeCompanyNames);

            // Garante que não tentamos pegar mais nomes do que existem na lista
            int namesToTake = Math.min(totalConflitos, fakeCompanyNames.size());

            nomesConflitantes = fakeCompanyNames.stream()
                    .limit(namesToTake)
                    .collect(Collectors.joining(", "));
        }

        novaSugestao.setConflitosMarca(totalConflitos);
        novaSugestao.setConflitosMarcaTecnologia(conflitosTecnologia);
        novaSugestao.setConflitosMarcaNomes(nomesConflitantes);

        sugestaoRepository.save(novaSugestao);
    }

    /**
     * Encontra uma sugestão pelo seu ID.
     * @param id O ID da sugestão.
     * @return A sugestão encontrada.
     * @throws IllegalArgumentException se a sugestão não for encontrada.
     */
    public SugestaoNome findById(Long id) {
        return sugestaoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sugestão não encontrada com o id: " + id));
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
     * @param filter O critério de filtro ("com", "combr", "no_conflicts", "recent").
     * @return A lista de sugestões filtrada e ordenada.
     */
    public List<SugestaoNome> getFilteredSuggestions(String filter) {
        return switch (filter) {
            case "com" -> sugestaoRepository.findByDominioComDisponivelTrueOrderByVotosDesc();
            case "combr" -> sugestaoRepository.findByDominioComBrDisponivelTrueOrderByVotosDesc();
            case "no_conflicts" -> sugestaoRepository.findByConflitosMarcaEqualsOrderByVotosDesc(0);
            case "recent" -> sugestaoRepository.findAllByOrderByCreatedAtDesc();
            default -> findAllOrderByVotos();
        };
    }
}
