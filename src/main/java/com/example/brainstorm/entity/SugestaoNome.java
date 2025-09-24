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
    private boolean dominioComDisponivel;
    private boolean dominioComBrDisponivel;
    private int conflitosMarca;
    private int conflitosMarcaTecnologia;
    private String conflitosMarcaNomes;
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

    public boolean isDominioComDisponivel() {
        return dominioComDisponivel;
    }

    public void setDominioComDisponivel(boolean dominioComDisponivel) {
        this.dominioComDisponivel = dominioComDisponivel;
    }

    public boolean isDominioComBrDisponivel() {
        return dominioComBrDisponivel;
    }

    public void setDominioComBrDisponivel(boolean dominioComBrDisponivel) {
        this.dominioComBrDisponivel = dominioComBrDisponivel;
    }

    public int getConflitosMarca() {
        return conflitosMarca;
    }

    public void setConflitosMarca(int conflitosMarca) {
        this.conflitosMarca = conflitosMarca;
    }

    public int getConflitosMarcaTecnologia() {
        return conflitosMarcaTecnologia;
    }

    public void setConflitosMarcaTecnologia(int conflitosMarcaTecnologia) {
        this.conflitosMarcaTecnologia = conflitosMarcaTecnologia;
    }

    public String getConflitosMarcaNomes() {
        return conflitosMarcaNomes;
    }

    public void setConflitosMarcaNomes(String conflitosMarcaNomes) {
        this.conflitosMarcaNomes = conflitosMarcaNomes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
