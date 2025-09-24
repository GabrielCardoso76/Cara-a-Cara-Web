package com.example.brainstorm.controller;

import com.example.brainstorm.entity.SugestaoNome;
import com.example.brainstorm.service.SugestaoService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Controller
public class SugestaoController {

    private final SugestaoService sugestaoService;

    @Autowired
    public SugestaoController(SugestaoService sugestaoService) {
        this.sugestaoService = sugestaoService;
    }

    /**
     * Lida com a página principal. Se o usuário estiver logado (na sessão),
     * mostra a lista de sugestões. Caso contrário, mostra a página de login.
     */
    @GetMapping("/")
    public String index(HttpSession session, Model model) {
        String username = (String) session.getAttribute("username");

        if (username == null) {
            // Se não há usuário na sessão, redireciona para a tela de login
            return "login";
        }

        // Se o usuário está logado, busca as sugestões e mostra a página principal
        List<SugestaoNome> sugestoes = sugestaoService.findAllOrderByVotos();
        model.addAttribute("sugestoes", sugestoes);
        model.addAttribute("username", username);
        model.addAttribute("activeFilter", "all"); // Define o filtro padrão

        return "index";
    }

    /**
     * Lida com a filtragem de sugestões.
     */
    @GetMapping("/filter")
    public String filter(@RequestParam(defaultValue = "all") String by, HttpSession session, Model model) {
        String username = (String) session.getAttribute("username");

        if (username == null) {
            return "login";
        }

        List<SugestaoNome> sugestoes = sugestaoService.getFilteredSuggestions(by);
        model.addAttribute("sugestoes", sugestoes);
        model.addAttribute("username", username);
        model.addAttribute("activeFilter", by); // Passa o filtro ativo para a view

        return "index";
    }

    /**
     * Processa o login do usuário, armazenando o nome na sessão.
     */
    @PostMapping("/login")
    public String login(@RequestParam String username, HttpSession session) {
        if (username != null && !username.trim().isEmpty()) {
            session.setAttribute("username", username.trim());
        }
        return "redirect:/";
    }

    /**
     * Salva uma nova sugestão de nome.
     */
    @PostMapping("/sugerir")
    public String sugerir(@RequestParam String nome, HttpSession session) {
        String autor = (String) session.getAttribute("username");

        // Garante que apenas usuários logados podem sugerir
        if (autor == null) {
            return "redirect:/login";
        }

        // Garante que o nome da sugestão não seja vazio
        if (nome != null && !nome.trim().isEmpty()) {
            sugestaoService.save(nome.trim(), autor);
        }

        return "redirect:/";
    }

    @PostMapping("/votar/{id}/up")
    public ResponseEntity<Void> upvote(@PathVariable Long id, HttpSession session) {
        if (session.getAttribute("username") == null) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }
        try {
            sugestaoService.upvote(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/votar/{id}/down")
    public ResponseEntity<Void> downvote(@PathVariable Long id, HttpSession session) {
        if (session.getAttribute("username") == null) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }
        try {
            sugestaoService.downvote(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
