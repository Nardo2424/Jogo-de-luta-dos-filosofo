// ==========================================
// 1. CENA DA LUTA (GameScene)
// ==========================================
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

preload() {
    this.load.image('platao', 'assets/platao.png');
    this.load.image('cenario', 'assets/lugarpelea.png');
    this.load.image('descartes', 'assets/decartes.png');
    this.load.image('ossoduroderoer', 'assets/caveradecarte.png');
    this.load.image('luzdoplato', 'assets/luzcega.png');
    this.load.image('plataoataque1', 'assets/plataogolpe1.png');
    this.load.image('plataoataque2', 'assets/plataogolpe2.png');
    this.load.image('plataoataque2,5', 'assets/plataogolpe2,5.png');
    this.load.image('plataoataque3', 'assets/plataogolpe3.png');
    this.load.image('decarteataque1', 'assets/decartegolpe1.png');
    this.load.image('decarteataque2', 'assets/decartegolpe2.png');
    this.load.image('decarteataque2,5', 'assets/decartegolpe2,5.png');
    this.load.image('decarteataque3', 'assets/decartegolpe3.png');
    this.load.image('plataoparado', 'assets/veiobebado1.png');
    this.load.image('plataoandando1', 'assets/veiobebado2.png');
    this.load.image('plataoandando2', 'assets/veiobebado3.png');
    this.load.image('decarteparado', 'assets/chadescartes1.png');
    this.load.image('decarteandando', 'assets/chadescartes2.png');
}

create() {
    this.p1Health = 100;
    this.p2Health = 100;
    
    this.p1Energy = 0; // Max 100 (50 = Nível 1 | 100 = Nível 2)
    this.p2Energy = 0;

    this.p1Facing = 1;
    this.p2Facing = -1;

    // 1. Cenário e Chão
    const largura = this.sys.game.config.width;
    const altura = this.sys.game.config.height;
    
    this.cenario = this.add.image(largura / 2, altura / 2, 'cenario');
    this.cenario.setDepth(0);
    
    // Chão transparente para colisão
    this.chao = this.add.rectangle(largura / 2, altura - 10, largura, 40, 0x000000, 0);
    this.physics.add.existing(this.chao, true);
    
    this.physics.world.TILE_BIAS = 32;

    // 2. Jogador 1 (Platão)
    this.player1 = this.physics.add.sprite(200, 300, 'platao');
    this.player1.setCollideWorldBounds(true);
    this.player1.body.setSize(50, 70);
    this.player1.body.setFriction(1, 1);
    this.player1.body.setBounce(0, 0);
    this.player1.setDepth(2);
    this.player1.setPushable(true);

    this.anims.create({
        key: 'platao_atacar_anim',
        frames: [
            { key: 'plataoataque1' },
            { key: 'plataoataque2' },
            { key: 'plataoataque2,5' },
            { key: 'plataoataque3' }
        ],
        frameRate: 12, 
        repeat: 0
    });

this.anims.create({
    key: 'platao_andar_anim',
    frames: [
        { key: 'plataoparado' },
        { key: 'plataoandando1' },
        { key: 'plataoandando2' }
    ],
    frameRate: 10,
    repeat: -1
});

    // 3. Jogador 2 (Descartes)
    this.player2 = this.physics.add.sprite(600, 300, 'descartes');
    this.player2.setCollideWorldBounds(true);
    this.player2.body.setSize(50, 70);
    this.player2.body.setFriction(1, 1);
    this.player2.body.setBounce(0, 0);
    this.player2.setDepth(2);
    this.player2.setPushable(true);

    this.anims.create({
        key: 'decartes_atacar_anim',
        frames: [
            { key: 'decarteataque1' },
            { key: 'decarteataque2' },
            { key: 'decarteataque2,5' },
            { key: 'decarteataque3' }
        ],
        frameRate: 12,
        repeat: 0
    });

    this.anims.create({
        key: 'decartes_andar_anim',
        frames: [
            { key: 'decarteparado' },
            { key: 'decarteandando' }
        ],
        frameRate: 10,
        repeat: -1
    });

    // Flags de Estado - P1
    this.player1.isMoving = false;
    this.player1.isAttacking = false;
    this.player1.isStunned = false;
    this.player1.isBlocking = false;
    this.player1.isParrying = false;
    this.player1.comboCount = 0;
    this.player1.comboTimer = null;
    this.player1.isExhausted = false;
    this.player1.isDashing = false;

    // Flags de Estado - P2
    this.player2.isMoving = false;
    this.player2.isAttacking = false;
    this.player2.isStunned = false;
    this.player2.isBlocking = false;
    this.player2.isParrying = false;
    this.player2.comboCount = 0;
    this.player2.comboTimer = null;
    this.player2.isExhausted = false;
    this.player2.isDashing = false;

    // 4. Colisões
    this.physics.add.collider(this.player1, this.chao);
    this.physics.add.collider(this.player2, this.chao);
    this.physics.add.collider(this.player1, this.player2);

    // 5. Controles (WASD para P1 | Setas para P2)
    this.keysWASD = this.input.keyboard.addKeys({
        cima: Phaser.Input.Keyboard.KeyCodes.W,
        esquerda: Phaser.Input.Keyboard.KeyCodes.A,
        direita: Phaser.Input.Keyboard.KeyCodes.D,
        soco: Phaser.Input.Keyboard.KeyCodes.SPACE,
        especial: Phaser.Input.Keyboard.KeyCodes.E,
        defesa: Phaser.Input.Keyboard.KeyCodes.S
    });

    this.keysSetas = this.input.keyboard.addKeys({
        cima: Phaser.Input.Keyboard.KeyCodes.UP,
        esquerda: Phaser.Input.Keyboard.KeyCodes.LEFT,
        direita: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        soco: Phaser.Input.Keyboard.KeyCodes.ENTER,
        especial: Phaser.Input.Keyboard.KeyCodes.L,
        defesa: Phaser.Input.Keyboard.KeyCodes.DOWN
    });

    // 6. Interface (HUD)
    this.add.text(20, 20, 'PLATÃO', { font: '18px Arial', fill: '#0064ff', style: 'bold' });
    this.add.text(580, 20, 'DESCARTES', { font: '18px Arial', fill: '#ff3333', style: 'bold' });

    this.p1HUDGraphics = this.add.graphics();
    this.p2HUDGraphics = this.add.graphics();

    this.atualizarHUD();
}

    update() {
    // ==========================================
    // --- MOVIMENTAÇÃO E ATAQUES P1 (PLATÃO) ---
    // ==========================================
    if (!this.player1.isStunned && !this.player1.isDashing) {

        // A. TENTA ATACAR
        if (!this.player1.isExhausted && !this.player1.isBlocking) {
            if (Phaser.Input.Keyboard.JustDown(this.keysWASD.soco) && !this.player1.isAttacking) {
                this.atacarNormal(this.player1, this.player2, this.p1Facing, 1);
            }
        }

        // B. MOVIMENTAÇÃO E DEFESA (SÓ FUNCIONAM SE NÃO ESTIVER ATACANDO)
        if (!this.player1.isAttacking) {
            // Parry e Defesa Contínua
            if (Phaser.Input.Keyboard.JustDown(this.keysWASD.defesa)) {
                this.ativarParry(this.player1);
            }

            if (this.keysWASD.defesa.isDown) {
                this.player1.isBlocking = true;
                this.player1.body.setVelocityX(0);
                this.player1.anims.stop();
                this.player1.setTexture('platao');
            } else {
                this.player1.isBlocking = false;
            }

            // Andar e Pular (SÓ se não estiver defendendo)
            if (!this.player1.isBlocking) {
                this.player1.body.setVelocityX(0);

                // Movimento Platão (P1)
                if (this.keysWASD.esquerda.isDown) {
                    this.player1.body.setVelocityX(-150);
                    this.p1Facing = -1;
                    this.player1.setFlipX(true);

                    if (!this.p1Andando) {
                        this.p1Andando = true;
                        this.passoPlatao();
                    }
                } else if (this.keysWASD.direita.isDown) {
                    this.player1.body.setVelocityX(150);
                    this.p1Facing = 1;
                    this.player1.setFlipX(false);

                    if (!this.p1Andando) {
                        this.p1Andando = true;
                        this.passoPlatao();
                    }
                } else {
                    this.player1.body.setVelocityX(0);
                    // Caso a tecla seja solta, garante o sprite estático
                    if (!this.p1Andando) {
                        this.player1.setTexture('platao');
                    }
                }

                // Pulo
                if (this.keysWASD.cima.isDown && this.player1.body.blocked.down) {
                    this.player1.body.setVelocityY(-550);
                }
            }
        } else {
            this.player1.body.setVelocityX(0);
        }

        // Especiais
        if (Phaser.Input.Keyboard.JustDown(this.keysWASD.especial) && !this.player1.isAttacking && !this.player1.isBlocking) {
            if (this.p1Energy === 100) {
                this.especialPlataoFinal();
            } else if (this.p1Energy >= 50) {
                this.especialPlataoInicial();
            }
        }
    }

    // =============================================
    // --- MOVIMENTAÇÃO E ATAQUES P2 (DESCARTES) ---
    // =============================================
    if (!this.player2.isStunned && !this.player2.isDashing) {
        if (!this.player2.isExhausted && !this.player2.isBlocking) {
            if (Phaser.Input.Keyboard.JustDown(this.keysSetas.soco) && !this.player2.isAttacking) {
                this.atacarNormal(this.player2, this.player1, this.p2Facing, 2);
            }
        }

        if (!this.player2.isAttacking) {
            if (Phaser.Input.Keyboard.JustDown(this.keysSetas.defesa)) {
                this.ativarParry(this.player2);
            }

            if (this.keysSetas.defesa.isDown) {
                this.player2.isBlocking = true;
                this.player2.body.setVelocityX(0);

                if (this.player2.texture.key !== 'descartes') {
                    this.player2.anims.stop();
                    this.player2.setTexture('descartes');
                }
            } else {
                this.player2.isBlocking = false;
            }

            if (!this.player2.isBlocking) {
                // MOVIMENTO DESCARTES (P2)
                if (this.keysSetas.esquerda.isDown) {
                    this.player2.body.setVelocityX(-150);
                    this.p2Facing = -1;
                    this.player2.setFlipX(true);

                    if (!this.p2Andando) {
                        this.p2Andando = true;
                        this.passoDescartes();
                    }
                } else if (this.keysSetas.direita.isDown) {
                    this.player2.body.setVelocityX(150);
                    this.p2Facing = 1;
                    this.player2.setFlipX(false);

                    if (!this.p2Andando) {
                        this.p2Andando = true;
                        this.passoDescartes();
                    }
                } else {
                    this.player2.body.setVelocityX(0);
                    if (!this.p2Andando) {
                        this.player2.setTexture('descartes');
                    }
                }

                // PULO DO DESCARTES
                if (this.keysSetas.cima.isDown && (this.player2.body.blocked.down || this.player2.body.touching.down)) {
                    this.player2.body.setVelocityY(-550);
                }
            }

            // Especiais
            if (Phaser.Input.Keyboard.JustDown(this.keysSetas.especial) && !this.player2.isAttacking && !this.player2.isBlocking) {
                if (this.p2Energy === 100) {
                    this.especialDescartesFinal();
                } else if (this.p2Energy >= 50) {
                    this.especialDescartesInicial();
                }
            }
        }
    }
}

// ==========================================
// ATAQUE NORMAL E KNOCKBACK
// ==========================================
atacarNormal(atacante, alvo, direcao, idAtacante) {
    if (atacante.isExhausted || atacante.isAttacking) return;

    // 1. Trava o estado de ataque e zera o movimento para não deslizar
    atacante.isAttacking = true;
    atacante.body.setVelocityX(0);
    atacante.comboCount++;

    if (idAtacante === 1) {
        // ==================== PLATÃO ====================
        if (atacante.comboCount === 1) {
            atacante.setTexture('plataoataque1');

            this.time.delayedCall(200, () => {
                if (atacante && atacante.active) {
                    atacante.setTexture('platao');
                    atacante.isAttacking = false;
                }
            });

        } else if (atacante.comboCount === 2) {
            atacante.setTexture('plataoataque2');

            this.time.delayedCall(200, () => {
                if (atacante && atacante.active) {
                    atacante.setTexture('platao');
                    atacante.isAttacking = false;
                }
            });

        } else if (atacante.comboCount >= 3) {
            atacante.setTexture('plataoataque2,5');

            this.time.delayedCall(120, () => {
                if (atacante && atacante.active) {
                    atacante.setTexture('plataoataque3');
                }
            });

            this.time.delayedCall(300, () => {
                if (atacante && atacante.active) {
                    atacante.setTexture('platao');
                    atacante.isAttacking = false;
                }
            });
        }
    } else {
        // ==================== DESCARTES ====================
        if (atacante.comboCount === 1) {
            atacante.setTexture('decarteataque1'); // 1º Golpe

            this.time.delayedCall(200, () => {
                if (atacante && atacante.active) {
                    atacante.setTexture('descartes');
                    atacante.isAttacking = false;
                }
            });

        } else if (atacante.comboCount === 2) {
            atacante.setTexture('decarteataque2'); // 2º Golpe

            this.time.delayedCall(200, () => {
                if (atacante && atacante.active) {
                    atacante.setTexture('descartes');
                    atacante.isAttacking = false;
                }
            });

        } else if (atacante.comboCount >= 3) {
            atacante.setTexture('decarteataque2,5'); // Preparação do golpe final

            this.time.delayedCall(120, () => {
                if (atacante && atacante.active) {
                    atacante.setTexture('decarteataque3'); // Golpe final
                }
            });

            this.time.delayedCall(300, () => {
                if (atacante && atacante.active) {
                    atacante.setTexture('descartes');
                    atacante.isAttacking = false;
                }
            });
        }
    }

    // 2. GESTÃO DE TIMERS DE COMBO E RESET
    if (atacante.comboTimer) {
        atacante.comboTimer.remove();
    }

    // 3. HITBOX E DANO
    const hitboxX = atacante.x + (direcao * 40);
    const hitboxY = atacante.y;

    const hitbox = this.add.rectangle(hitboxX, hitboxY, 40, 30, 0xffff00, 0.5);
    this.physics.add.existing(hitbox);
    hitbox.body.setAllowGravity(false);

    let acertou = false;

    this.physics.add.overlap(hitbox, alvo, () => {
        if (!acertou) {
            acertou = true;
            const idAlvo = idAtacante === 1 ? 2 : 1;

            this.receberGolpe(idAlvo, 4, idAtacante, direcao);

            this.adicionarEnergia(idAtacante, 8);
            this.adicionarEnergia(idAlvo, 4);
        }
    });

    // Limpa a hitbox do golpe atual
    this.time.delayedCall(150, () => {
        if (hitbox && hitbox.active) {
            hitbox.destroy();
        }
    });

    // 4. TRAVA DE COMBO / EXAUSTÃO
    if (atacante.comboCount >= 3) {
        this.aplicarTravaCombo(atacante);
    } else {
        atacante.comboTimer = this.time.delayedCall(800, () => {
            atacante.comboCount = 0;
        });
    }
}

    passoPlatao() {
    if (!this.keysWASD.esquerda.isDown && !this.keysWASD.direita.isDown) {
        this.player1.setTexture('plataoparado');
        this.p1Andando = false;
        return;
    }

    this.player1.setTexture('plataoandando1');

    this.time.delayedCall(150, () => {
        this.player1.setTexture('plataoparado');

        this.time.delayedCall(150, () => {
            this.player1.setTexture('plataoandando2');

            this.time.delayedCall(50, () => {
                this.player1.setTexture('plataoparado');

                if (this.keysWASD.esquerda.isDown || this.keysWASD.direita.isDown) {
                    this.passoPlatao();
                } else {
                    this.p1Andando = false;
                }
            });
        });
    });
}

passoDescartes() {
    if (!this.keysSetas.esquerda.isDown && !this.keysSetas.direita.isDown) {
        this.player2.setTexture('decarteparado');
        this.p2Andando = false;
        return;
    }

    this.player2.setTexture('decarteandando');

    this.time.delayedCall(150, () => {
        this.player2.setTexture('decarteparado');

        this.time.delayedCall(50, () => {
            if (this.keysSetas.esquerda.isDown || this.keysSetas.direita.isDown) {
                this.passoDescartes();
            } else {
                this.p2Andando = false;
            }
        });
    });
}

// ==========================================
// ESPECIAIS DO PLATÃO (P1)
// ==========================================
especialPlataoInicial() {
    this.p1Energy -= 50;
    this.atualizarHUD();

    const p1 = this.player1;
    const p2 = this.player2;

    p1.isDashing = true;
    p1.isAttacking = true;

    const texto = this.add.text(p1.x, p1.y - 80, 'MIMESIS IMPERFEITA!', { 
        font: '20px Courier', // Fonte tipo código/terminal para dar a ideia da quarta parede
        fill: '#00ff00', 
        style: 'bold' 
    }).setOrigin(0.5);

    const velocidadeDash = this.p1Facing * 850;
    p1.body.setVelocityX(velocidadeDash);

    const hitbox = this.add.rectangle(p1.x, p1.y, 70, 100, 0x00ff00, 0);
    this.physics.add.existing(hitbox);
    hitbox.body.setAllowGravity(false);

    let acertou = false;

    const updateLoop = this.time.addEvent({
        delay: 16,
        callback: () => {
            if (hitbox && hitbox.active) {
                hitbox.setPosition(p1.x, p1.y);
            }
        },
        loop: true
    });

    this.physics.add.overlap(hitbox, p2, () => {
        if (!acertou) {
            acertou = true;

            this.causarDano(2, 18);
            this.aplicarKnockback(p2, this.p1Facing, 500, -100);

            updateLoop.destroy();
            hitbox.destroy();

            // --- INÍCIO DA CORRUPÇÃO METAFÍSICA DO SPRITE DO DESCARTES ---

            // Guarda as propriedades originais para restaurar depois
            const escalaXOriginal = p2.scaleX;
            const escalaYOriginal = p2.scaleY;

            // A) "Achata" e distorce o sprite para quebrar a proporção artística
            p2.setScale(escalaXOriginal * 1.6, escalaYOriginal * 0.4);

            // B) Loop de Glitch Digital/Falha de Renderização (Roda a cada 30ms)
            const coresGlitch = [0xff0000, 0x00ffff, 0xff00ff, 0x00ff00, 0xffffff];
            let contadorGlitch = 0;

            const glitchEvent = this.time.addEvent({
                delay: 30,
                callback: () => {
                    contadorGlitch++;

                    // Alterna cores vibrantes simulando erro de buffer de vídeo
                    const corSorteada = Phaser.Math.RND.pick(coresGlitch);
                    p2.setTint(corSorteada);

                    // Efeito de "Tremer" o sprite fora da posição real (Jitter)
                    const offsetX = Phaser.Math.Between(-8, 8);
                    const offsetY = Phaser.Math.Between(-4, 4);
                    p2.setOffset(offsetX, offsetY);

                    // Oscila a opacidade
                    p2.setAlpha(Phaser.Math.FloatBetween(0.3, 0.9));
                },
                loop: true
            });

            // C) Restaura o Descartes ao estado "Real/Ideal" após 700ms
            this.time.delayedCall(700, () => {
                glitchEvent.destroy();
                
                // Limpa todos os efeitos digitais
                p2.clearTint();
                p2.setAlpha(1);
                p2.setScale(escalaXOriginal, escalaYOriginal);
                p2.setOffset(0, 0); // Zera o deslocamento
            });
        }
    });

    // Final do Dash do Platão
    this.time.delayedCall(400, () => {
        if (hitbox && hitbox.active) {
            updateLoop.destroy();
            hitbox.destroy();
        }

        texto.destroy();
        p1.isDashing = false;
        p1.isAttacking = false;
        p1.body.setVelocityX(0);
    });
}

    especialPlataoFinal() {
    this.p1Energy = 0;
    this.atualizarHUD();

    const p1 = this.player1;
    const p2 = this.player2;

    p1.isDashing = true;
    p1.isAttacking = true;

    const velocidadeDash = this.p1Facing * 900;
    p1.body.setVelocityX(velocidadeDash);

    p1.setTexture('luzdoplato');

    const largura = this.sys.game.config.width;
    const altura = this.sys.game.config.height;

    this.flashLuz = this.add.rectangle(largura / 2, altura / 2, largura, altura, 0xffffff, 0.6);
    this.flashLuz.setDepth(4);
    this.flashLuz.setBlendMode(Phaser.BlendModes.ADD);

    this.textoEspecialPlatao = this.add.text(p1.x, p1.y - 100, 'LUZ CEGANTE!', { 
        font: '24px Arial', 
        fill: '#ffff00', 
        style: 'bold' 
    }).setOrigin(0.5).setDepth(20);

    let hits = 0;

    // 3. Timer de Dano Multi-Hit salvo no 'this'
    this.intervaloDanoPlatao = this.time.addEvent({
        delay: 50,
        callback: () => {
            if (p1 && p2 && Phaser.Geom.Intersects.RectangleToRectangle(p1.getBounds(), p2.getBounds())) {
                if (hits < 7) {
                    hits++;
                    this.causarDano(2, 5);
                    this.aplicarKnockback(p2, this.p1Facing, 80, -10);
                }
            }
        },
        loop: true
    });

    this.time.delayedCall(450, () => {
        this.interromperEspecialPlatao();
    });
}

interromperEspecialPlatao() {
    const p1 = this.player1;

    if (this.intervaloDanoPlatao) {
        this.intervaloDanoPlatao.destroy();
        this.intervaloDanoPlatao = null;
    }

    if (this.flashLuz) {
        this.flashLuz.destroy();
        this.flashLuz = null;
    }
    if (this.textoEspecialPlatao) {
        this.textoEspecialPlatao.destroy();
        this.textoEspecialPlatao = null;
    }

    if (p1) {
        p1.setTexture('platao'); 
        p1.body.setVelocityX(0);
        p1.isDashing = false;
        p1.isAttacking = false;
    }

    if (this.bg) {
        this.bg.clearTint();
    }
}

    // ==========================================
    // ESPECIAIS DO DESCARTES (P2)
    // ==========================================
    especialDescartesInicial() {
        // Nível 1: Plano Cartesiano (Vetor para parede)
        this.p2Energy -= 50;
        this.atualizarHUD();

        const p2 = this.player2;
        const p1 = this.player1;
        p2.isDashing = true;
        p2.isAttacking = true;

        const largura = this.sys.game.config.width;
        const altura = this.sys.game.config.height;

        const pcEspecial = this.add.image(largura / 2, altura / 2, 'ossoduroderoer');
        pcEspecial.setDisplaySize(largura, altura);
        pcEspecial.setDepth(1);

        const velocidadeDash = this.p2Facing * 700; 
        p2.body.setVelocityX(velocidadeDash);

        const hitbox = this.add.rectangle(p2.x, p2.y, 60, 100, 0x00ffff, 0.5);
        this.physics.add.existing(hitbox);
        hitbox.body.setAllowGravity(false);

        let acertou = false;
        const updateLoop = this.time.addEvent({
            delay: 16,
            callback: () => hitbox.setPosition(p2.x, p2.y),
            loop: true
        });

        this.physics.add.overlap(hitbox, p1, () => {
            if (!acertou) {
                acertou = true;
                this.causarDano(1, 15);
                this.aplicarKnockback(p1, this.p2Facing, 900, -100);
                updateLoop.destroy();
                hitbox.destroy();
            }
        });

        this.time.delayedCall(400, () => {
            if (hitbox && hitbox.active) {
                updateLoop.destroy();
                hitbox.destroy();
            }
            if (pcEspecial) {
                pcEspecial.destroy(); 
            }
            p2.isDashing = false;
            p2.isAttacking = false;
            p2.body.setVelocityX(0);
        });
    }

    especialDescartesFinal() {
        // Nível 2: Ut duo cogito, ergo ut duo existo
        this.p2Energy = 0;
        this.atualizarHUD();

        const p2 = this.player2;
        const p1 = this.player1;

        // Trava os controles e a física do Descartes original
        p2.isAttacking = true;
        p2.isDashing = false;
        p2.body.setVelocityX(0);

        // Texto do especial
        this.textoEspecialDescartes = this.add.text(p2.x, p2.y - 80, 'UT DUO COGITO, ERGO UT DUO EXISTO!', {
            font: '18px Arial',
            fill: '#ff00ff',
            style: 'bold'
        }).setOrigin(0.5).setDepth(20);

        // 1. Instancia o Clone na mesma posição do Descartes
        this.cloneDescartes = this.physics.add.sprite(p2.x, p2.y, 'descartes');
        this.cloneDescartes.body.setAllowGravity(false);
        this.cloneDescartes.setAlpha(0.7);
        this.cloneDescartes.setDepth(p2.depth - 1);
        this.cloneDescartes.setFlipX(p2.flipX);

        // 2. APLICA VELOCIDADE APENAS NO CLONE (O clone é quem avança!)
        const velocidadeDash = this.p2Facing * 850;
        this.cloneDescartes.body.setVelocityX(velocidadeDash);

        let acertou = false;

        // 3. A colisão de dano agora é checada APENAS entre o Clone e o Platão (P1)
        this.overlapClone = this.physics.add.overlap(this.cloneDescartes, p1, () => {
            if (!acertou) {
                acertou = true;

                this.causarDano(1, 35);
                this.aplicarKnockback(p1, this.p2Facing, 700, -300);

                // Efeito de impacto no clone ao acertar
                this.cloneDescartes.setTint(0x00ffff);
            }
        });

        // 4. Finalização do Golpe
        this.time.delayedCall(400, () => {
            if (this.cloneDescartes) {
                this.cloneDescartes.destroy();
            }
            if (this.textoEspecialDescartes) {
                this.textoEspecialDescartes.destroy();
            }
            if (this.overlapClone) {
                this.overlapClone.destroy();
            }
            p2.isDashing = false;
            p2.isAttacking = false;
            p2.body.setVelocityX(0);
        });
    }

    // ==========================================
    // FUNÇÕES AUXILIARES
    // ==========================================
    executarDashBase(atacante, alvo, direcao, nomeAtaque, dano, forcaH, forcaV) {
        atacante.isDashing = true;
        atacante.isAttacking = true;

        const texto = this.add.text(atacante.x, atacante.y - 80, nomeAtaque, { font: '20px Arial', fill: '#ffff00', style: 'bold' }).setOrigin(0.5);
        atacante.body.setVelocityX(direcao * 700);

        const hitbox = this.add.rectangle(atacante.x, atacante.y, 60, 100, 0xffff00, 0.5);
        this.physics.add.existing(hitbox);
        hitbox.body.setAllowGravity(false);

        let acertou = false;
        const updateLoop = this.time.addEvent({
            delay: 16,
            callback: () => hitbox.setPosition(atacante.x + (direcao * 20), atacante.y),
            loop: true
        });

        this.physics.add.overlap(hitbox, alvo, () => {
            if (!acertou) {
                acertou = true;
                atacante.body.setVelocityX(0);
                const idAlvo = atacante === this.player1 ? 2 : 1;
                this.causarDano(idAlvo, dano);
                this.aplicarKnockback(alvo, direcao, forcaH, forcaV);
            }
        });

        this.time.delayedCall(350, () => {
            updateLoop.destroy();
            hitbox.destroy();
            texto.destroy();
            atacante.isDashing = false;
            atacante.isAttacking = false;
            atacante.body.setVelocityX(0);
        });
    }

    adicionarEnergia(idJogador, quantidade) {
        if (idJogador === 1) {
            this.p1Energy = Math.min(100, this.p1Energy + quantidade);
        } else {
            this.p2Energy = Math.min(100, this.p2Energy + quantidade);
        }
        this.atualizarHUD();
    }

    aplicarKnockback(alvo, direcaoAtaque, forcaH, forcaV) {
        alvo.isStunned = true;
        alvo.body.setVelocityX(direcaoAtaque * forcaH);
        alvo.body.setVelocityY(0);

        this.time.delayedCall(250, () => {
            alvo.isStunned = false;
        });
    }

    causarDano(idAlvo, quantidadeDano) {
        if (idAlvo === 1) {
            this.p1Health = Math.max(0, this.p1Health - quantidadeDano);
            if (this.p1Health === 0) this.encerrarPartida('DESCARTES VENCEU!');
        } else if (idAlvo === 2) {
            this.p2Health = Math.max(0, this.p2Health - quantidadeDano);
            if (this.p2Health === 0) this.encerrarPartida('PLATÃO VENCEU!');
        }
        this.atualizarHUD();
    }

    receberGolpe(idAlvo, danoBase, idAtacante, direcaoKnockback) {
    const alvo = idAlvo === 1 ? this.player1 : this.player2;
    const atacante = idAtacante === 1 ? this.player1 : this.player2;

    // 1. CASO DE PARRY (Aparo Perfeito)
    if (alvo.isParrying) {
        // Feedback visual (Flash Branco)
        alvo.setTint(0xffffff);
        this.time.delayedCall(100, () => alvo.clearTint());

        // Texto de Parry
        const txt = this.add.text(alvo.x, alvo.y - 50, 'PARRY!', { font: '16px Arial', fill: '#00ffff', style: 'bold' }).setOrigin(0.5);
        this.time.delayedCall(500, () => txt.destroy());

        // Anula todo o dano e Atordoa/Stuna o atacante por contra-ataque
        this.adicionarEnergia(idAlvo, 10); // Recompensa de energia
        this.aplicarStun(atacante, 600);   // Atacante fica 600ms vulnerável
        return;
    }

    // 2. CASO DE DEFESA NORMAL
    if (alvo.isBlocking) {
        const danoReduzido = Math.floor(danoBase * 0.2); // Recebe apenas 20% do dano
        this.causarDano(idAlvo, danoReduzido);

        // Feedback de bloqueio
        const txt = this.add.text(alvo.x, alvo.y - 50, 'BLOQUEADO!', { font: '12px Arial', fill: '#ffff00' }).setOrigin(0.5);
        this.time.delayedCall(400, () => txt.destroy());

        // Sem knockback
        return;
    }

    // 3. GOLPE NORMAL (Sem defesa)
    this.causarDano(idAlvo, danoBase);
    this.aplicarKnockback(alvo, direcaoKnockback, 120, -50);

    if (idAlvo === 1) {
        alvo.setTexture('platao'); 
    } else if (idAlvo === 2) {
        alvo.setTexture('descartes'); 
    }
}

    aplicarStun(jogador, duracao) {
        jogador.isStunned = true;
        jogador.body.setVelocityX(0);
        jogador.fillColor = 0x888888; // Fica cinza indicando tontura

        this.time.delayedCall(duracao, () => {
            jogador.isStunned = false;
            jogador.fillColor = jogador === this.player1 ? 0x0064ff : 0xff3333;
        });
    }

    encerrarPartida(vencedor) {
        this.physics.pause();
        this.time.delayedCall(500, () => {
            this.scene.start('GameOverScene', { vencedor: vencedor });
        });
    }

    // --- DESENHO DO HUD (VIDA + DUAS BARRAS DE ESPECIAL) ---
    atualizarHUD() {
        // --- JOGADOR 1 ---
        this.p1HUDGraphics.clear();
        this.p1HUDGraphics.fillStyle(0x333333);
        this.p1HUDGraphics.fillRect(20, 45, 200, 20);
        this.p1HUDGraphics.lineStyle(2, 0xffffff);
        this.p1HUDGraphics.strokeRect(20, 45, 200, 20);

        const larguraVidaP1 = (this.p1Health / 100) * 200;
        if (larguraVidaP1 > 0) {
            this.p1HUDGraphics.fillStyle(0x00ff00);
            this.p1HUDGraphics.fillRect(20, 45, larguraVidaP1, 20);
        }

        // Barra 1 de Especial P1 (0 a 50%)
        this.p1HUDGraphics.fillStyle(0x222222);
        this.p1HUDGraphics.fillRect(20, 70, 98, 10);
        this.p1HUDGraphics.strokeRect(20, 70, 98, 10);
        if (this.p1Energy > 0) {
            const perc1 = Math.min(50, this.p1Energy) / 50;
            this.p1HUDGraphics.fillStyle(this.p1Energy >= 50 ? 0xffff00 : 0x00d8ff);
            this.p1HUDGraphics.fillRect(20, 70, perc1 * 98, 10);
        }

        // Barra 2 de Especial P1 (50% a 100%)
        this.p1HUDGraphics.fillStyle(0x222222);
        this.p1HUDGraphics.fillRect(122, 70, 98, 10);
        this.p1HUDGraphics.strokeRect(122, 70, 98, 10);
        if (this.p1Energy > 50) {
            const perc2 = (this.p1Energy - 50) / 50;
            this.p1HUDGraphics.fillStyle(this.p1Energy === 100 ? 0xff00ff : 0xffff00);
            this.p1HUDGraphics.fillRect(122, 70, perc2 * 98, 10);
        }

        // --- JOGADOR 2 ---
        this.p2HUDGraphics.clear();
        this.p2HUDGraphics.fillStyle(0x333333);
        this.p2HUDGraphics.fillRect(580, 45, 200, 20);
        this.p2HUDGraphics.lineStyle(2, 0xffffff);
        this.p2HUDGraphics.strokeRect(580, 45, 200, 20);

        const larguraVidaP2 = (this.p2Health / 100) * 200;
        if (larguraVidaP2 > 0) {
            const xOffsetVida = 580 + (200 - larguraVidaP2);
            this.p2HUDGraphics.fillStyle(0x00ff00);
            this.p2HUDGraphics.fillRect(xOffsetVida, 45, larguraVidaP2, 20);
        }

        // Barra 1 de Especial P2 (0 a 50%)
        this.p2HUDGraphics.fillStyle(0x222222);
        this.p2HUDGraphics.fillRect(682, 70, 98, 10);
        this.p2HUDGraphics.strokeRect(682, 70, 98, 10);
        if (this.p2Energy > 0) {
            const perc1 = Math.min(50, this.p2Energy) / 50;
            const larg = perc1 * 98;
            this.p2HUDGraphics.fillStyle(this.p2Energy >= 50 ? 0xffff00 : 0x00d8ff);
            this.p2HUDGraphics.fillRect(780 - larg, 70, larg, 10);
        }

        // Barra 2 de Especial P2 (50% a 100%)
        this.p2HUDGraphics.fillStyle(0x222222);
        this.p2HUDGraphics.fillRect(580, 70, 98, 10);
        this.p2HUDGraphics.strokeRect(580, 70, 98, 10);
        if (this.p2Energy > 50) {
            const perc2 = (this.p2Energy - 50) / 50;
            const larg = perc2 * 98;
            this.p2HUDGraphics.fillStyle(this.p2Energy === 100 ? 0xff00ff : 0xffff00);
            this.p2HUDGraphics.fillRect(678 - larg, 70, larg, 10);
        }
    }

    ativarParry(jogador) {
        jogador.isParrying = true;

        // A janela de tempo para acertar o Parry é de 150 milissegundos
        this.time.delayedCall(150, () => {
            jogador.isParrying = false;
        });
    }

    aplicarTravaCombo(jogador) {
        jogador.isExhausted = true;
        jogador.comboCount = 0;

        // Feedback visual temporário (escurece o jogador para indicar a trava)
        const corOriginal = jogador === this.player1 ? 0x0064ff : 0xff3333;
        jogador.fillColor = 0x555555; // Fica cinza durante o cooldown

        const textoPausa = this.add.text(jogador.x, jogador.y - 80, 'EXAUSTO!', { font: '20px Arial', fill: '#ff0000', style: 'bold' }).setOrigin(0.5);

        const loopTexto = this.time.addEvent({
            delay: 16,
            callback: () => {
                if (textoPausa.active) textoPausa.setPosition(jogador.x, jogador.y - 60);
            },
            loop: true
        });

        // Duração do tempo de trava (ex: 900 milissegundos)
        this.time.delayedCall(800, () => {
            jogador.isExhausted = false;
            jogador.fillColor = corOriginal; // Volta à cor normal
            loopTexto.destroy();
            textoPausa.destroy();
        });
    }
}

// ==========================================
// 2. CENA DE GAME OVER (GameOverScene)
// ==========================================
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.vencedorTexto = data.vencedor || 'FIM DE JOGO';
    }

    create() {
        this.cameras.main.setBackgroundColor('#111111');
        this.add.text(400, 220, 'FIM DA LUTA', { font: '28px Arial', fill: '#888888' }).setOrigin(0.5);
        this.add.text(400, 280, this.vencedorTexto, { font: '40px Arial', fill: '#ffffff', style: 'bold' }).setOrigin(0.5);
        this.add.text(400, 400, 'Pressione [ R ] ou [ ESPAÇO ] para jogar novamente', {
            font: '18px Arial',
            fill: '#00ff00'
        }).setOrigin(0.5);

        this.teclaR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.teclaEspaco = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.teclaR) || Phaser.Input.Keyboard.JustDown(this.teclaEspaco)) {
            this.scene.start('GameScene');
        }
    }
}

// Configuração
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: true
        }
    },
    scene: [GameScene, GameOverScene]
};

const game = new Phaser.Game(config);