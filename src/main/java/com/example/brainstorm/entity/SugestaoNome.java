package com.example.brainstorm.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;

@Entity
public class SugestaoNome {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String autor;
    private int votos;
    private boolean dominioDisponivel;
    private boolean inpiDisponivel;
    private LocalDateTime createdAt;

    // Construtor padrão exigido pelo JPA
    public SugestaoNome() {
    }

    // Getters e Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getAutor() {
        return autor;
    }

    public void setAutor(String autor) {
        this.autor = autor;
    }

    public int getVotos() {
        return votos;
    }

    public void setVotos(int votos) {
        this.votos = votos;
    }

    public boolean isDominioDisponivel() {
        return dominioDisponivel;
    }

    public void setDominioDisponivel(boolean dominioDisponivel) {
        this.dominioDisponivel = dominioDisponivel;
    }

    public boolean isInpiDisponivel() {
        return inpiDisponivel;
    }

    public void setInpiDisponivel(boolean inpiDisponivel) {
        this.inpiDisponivel = inpiDisponivel;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
