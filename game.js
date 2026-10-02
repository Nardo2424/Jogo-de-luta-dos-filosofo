// ==========================================
// 1. CENA DA LUTA (GameScene)
// ==========================================
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Substitua o caminho pelo local correto do seu arquivo na pasta do projeto (ex: 'assets/platao.png')
        this.load.image('platao', 'sprites/pratao-sprite.png');
    }

    create() {
        this.p1Health = 100;
        this.p2Health = 100;
        
        this.p1Energy = 0; // Max 100 (50 = Nível 1 | 100 = Nível 2)
        this.p2Energy = 0;

        this.p1Facing = 1;
        this.p2Facing = -1;

        // 1. Chão
        const chao = this.add.rectangle(400, 575, 800, 50, 0x666666);
        this.physics.add.existing(chao, true);

        // 2. Jogadores
        this.player1 = this.physics.add.sprite(50, 0, 200, 300, 'platao');
        this.player1 = this.physics.add.existing(rectP1);
        this.player1.setCollideWorldBounds(true);
        this.player1.body.setFriction(1, 1);
        this.player1.setPosition(200, 300);

        const rectP2 = this.add.rectangle(0, 0, 50, 100, 0xff3333);
        this.player2 = this.physics.add.existing(rectP2);
        this.player2.body.setCollideWorldBounds(true);
        this.player2.body.setFriction(1, 1);
        this.player2.setPosition(600, 300);

        // Flags de estado
        this.player1.isAttacking = false;
        this.player1.isStunned = false;
        this.player1.body.checkCollision.up = false;
        this.player1.isBlocking = false;
        this.player1.isParrying = false;
        this.player1.comboCount = 0;
        this.player1.comboTimer = null;
        this.player1.isExhausted = false;
        this.player1.isDashing = false;

        this.player2.isAttacking = false;
        this.player2.isStunned = false;
        this.player2.body.checkCollision.up = false;
        this.player2.isBlocking = false;
        this.player2.isParrying = false;
        this.player2.comboCount = 0;
        this.player2.comboTimer = null;
        this.player2.isExhausted = false;
        this.player2.isDashing = false;

        // 3. Colisões
        this.physics.add.collider(this.player1, chao);
        this.physics.add.collider(this.player2, chao);
        this.physics.add.collider(this.player1, this.player2);
        this.player1.comboCount = 0;
        this.player1.body.setBounce(0, 0);
        this.player2.body.setBounce(0, 0);

        // 4. Controles
        this.keysWASD = this.input.keyboard.addKeys({
            cima: Phaser.Input.Keyboard.KeyCodes.W,
            esquerda: Phaser.Input.Keyboard.KeyCodes.A,
            direita: Phaser.Input.Keyboard.KeyCodes.D,
            soco: Phaser.Input.Keyboard.KeyCodes.SPACE,
            especial: Phaser.Input.Keyboard.KeyCodes.E,
            defesa: Phaser.Input.Keyboard.KeyCodes.C
        });

        this.keysSetas = this.input.keyboard.addKeys({
            cima: Phaser.Input.Keyboard.KeyCodes.UP,
            esquerda: Phaser.Input.Keyboard.KeyCodes.LEFT,
            direita: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            soco: Phaser.Input.Keyboard.KeyCodes.ENTER,
            especial: Phaser.Input.Keyboard.KeyCodes.L,
            defesa: Phaser.Input.Keyboard.KeyCodes.P
        });

        // 5. Interface (HUD)
        this.add.text(20, 20, 'PLATÃO', { font: '18px Arial', fill: '#0064ff', style: 'bold' });
        this.add.text(580, 20, 'DESCARTES', { font: '18px Arial', fill: '#ff3333', style: 'bold' });

        this.p1HUDGraphics = this.add.graphics();
        this.p2HUDGraphics = this.add.graphics();

        this.atualizarHUD();
    }

    update() {
        // --- MOVIMENTAÇÃO E ATAQUES P1 ---
        if (!this.player1.isStunned && !this.player1.isDashing) {
            this.player1.body.setVelocityX(0);
            if (this.keysWASD.esquerda.isDown) {
                this.player1.body.setVelocityX(-250);
                this.p1Facing = -1;
            } else if (this.keysWASD.direita.isDown) {
                this.player1.body.setVelocityX(250);
                this.p1Facing = 1;
            }

            if (this.keysWASD.cima.isDown && this.player1.body.blocked.down) {
                this.player1.body.setVelocityY(-550);
            }

            // Soco Normal
            if (!this.player1.isExhausted) {
                if (Phaser.Input.Keyboard.JustDown(this.keysWASD.soco) && !this.player1.isAttacking) {
                    this.atacarNormal(this.player1, this.player2, this.p1Facing, 1);
                }
            }

            if (this.keysWASD.defesa.isDown && !this.player1.isAttacking) {
                this.player1.isBlocking = true;
                this.player1.body.setVelocityX(0); // Fica parado defendendo
            } else {
                this.player1.isBlocking = false;
            }

            if (!this.player1.isBlocking) {
                this.player1.body.setVelocityX(0);
                if (this.keysWASD.esquerda.isDown) this.player1.body.setVelocityX(-250);
                if (this.keysWASD.direita.isDown) this.player1.body.setVelocityX(250);
                if (this.keysWASD.cima.isDown && this.player1.body.blocked.down) this.player1.body.setVelocityY(-550);
            }

            if (Phaser.Input.Keyboard.JustDown(this.keysWASD.defesa) && !this.player1.isAttacking) {
                this.ativarParry(this.player1);
            }

            // Ativação de Especiais (E)
            if (Phaser.Input.Keyboard.JustDown(this.keysWASD.especial) && !this.player1.isAttacking) {
                if (this.p1Energy === 100) {
                    this.especialPlataoFinal();
                } else if (this.p1Energy >= 50) {
                    this.especialPlataoInicial();
                }
            }
        }

        // --- MOVIMENTAÇÃO E ATAQUES P2 ---
        if (!this.player2.isStunned && !this.player2.isDashing) {
            this.player2.body.setVelocityX(0);
            if (this.keysSetas.esquerda.isDown) {
                this.player2.body.setVelocityX(-250);
                this.p2Facing = -1;
            } else if (this.keysSetas.direita.isDown) {
                this.player2.body.setVelocityX(250);
                this.p2Facing = 1;
            }

            if (this.keysSetas.cima.isDown && this.player2.body.blocked.down) {
                this.player2.body.setVelocityY(-550);
            }

            // Soco Normal
            if (!this.player2.isExhausted) {
                if (Phaser.Input.Keyboard.JustDown(this.keysSetas.soco) && !this.player2.isAttacking) {
                    this.atacarNormal(this.player2, this.player1, this.p2Facing, 2);
                }
            }

            if (this.keysWASD.defesa.isDown && !this.player1.isAttacking) {
                this.player1.isBlocking = true;
                this.player1.body.setVelocityX(0); // Fica parado defendendo
            } else {
                this.player1.isBlocking = false;
            }

            if (!this.player1.isBlocking) {
                this.player1.body.setVelocityX(0);
                if (this.keysWASD.esquerda.isDown) this.player1.body.setVelocityX(-250);
                if (this.keysWASD.direita.isDown) this.player1.body.setVelocityX(250);
                if (this.keysWASD.cima.isDown && this.player1.body.blocked.down) this.player1.body.setVelocityY(-550);
            }

            if (Phaser.Input.Keyboard.JustDown(this.keysWASD.defesa) && !this.player1.isAttacking) {
                this.ativarParry(this.player1);
            }

            // Ativação de Especiais (SHIFT)
            if (Phaser.Input.Keyboard.JustDown(this.keysSetas.especial) && !this.player2.isAttacking) {
                if (this.p2Energy === 100) {
                    this.especialDescartesFinal();
                } else if (this.p2Energy >= 50) {
                    this.especialDescartesInicial();
                }
            }
        }
    }

    // ==========================================
    // ATAQUE NORMAL E KNOCKBACK
    // ==========================================
    atacarNormal(atacante, alvo, direcao, idAtacante) {
        if (atacante.isExhausted || atacante.isAttacking) return;
        
        atacante.isAttacking = true;
        atacante.comboCount++;

        if (atacante.comboTimer) {
        atacante.comboTimer.remove();
        }

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

        this.time.delayedCall(150, () => hitbox.destroy());
        this.time.delayedCall(300, () => atacante.isAttacking = false);
        if (atacante.comboCount >= 3) {
            this.aplicarTravaCombo(atacante);
        } else {
            atacante.comboTimer = this.time.delayedCall(800, () => {
                atacante.comboCount = 0;
            });
        }
    }

    // ==========================================
    // ESPECIAIS DO PLATÃO (P1)
    // ==========================================
    especialPlataoInicial() {
        // Nível 1: Réplica Imperfeita
        this.p1Energy -= 50;
        this.atualizarHUD();
        this.executarDashBase(this.player1, this.player2, this.p1Facing, 'Réplica Imperfeita!', 15, 450, -200);
    }

    especialPlataoFinal() {
        // Nível 2: A Luz Cegante (Multi-Hit contínuo)
        this.p1Energy = 0;
        this.atualizarHUD();

        const p1 = this.player1;
        const p2 = this.player2;
        p1.isDashing = true;
        p1.isAttacking = true;

        const texto = this.add.text(p1.x, p1.y - 80, 'A LUZ CEGANTE!', { font: '20px Arial', fill: '#ffff00', style: 'bold' }).setOrigin(0.5);
        p1.body.setVelocityX(this.p1Facing * 700);

        const luzVisual = this.add.rectangle(p1.x, p1.y, 100, 120, 0xffffff, 0.8);
        this.physics.add.existing(luzVisual);
        luzVisual.body.setAllowGravity(false);

        let hits = 0;
        const intervaloDano = this.time.addEvent({
            delay: 50,
            callback: () => {
                luzVisual.setPosition(p1.x + (this.p1Facing * 30), p1.y);
                if (Phaser.Geom.Intersects.RectangleToRectangle(luzVisual.getBounds(), p2.getBounds())) {
                    if (hits < 7) { // 7 hits de 5 de dano = 35 total
                        hits++;
                        this.causarDano(2, 5);
                        this.aplicarKnockback(p2, this.p1Facing, 100, -20);
                    }
                }
            },
            loop: true
        });

        this.time.delayedCall(450, () => {
            intervaloDano.destroy();
            luzVisual.destroy();
            texto.destroy();
            p1.isDashing = false;
            p1.isAttacking = false;
            p1.body.setVelocityX(0);
        });
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

        const texto = this.add.text(p2.x, p2.y - 80, 'PLANO CARTESIANO!', { font: '20px Arial', fill: '#00ffff', style: 'bold' }).setOrigin(0.5);
        
        // Efeito visual de malha no fundo
        const linhasGrid = this.add.grid(400, 300, 800, 600, 40, 40, 0x00ffff, 0.2);

        p2.body.setVelocityX(this.p2Facing * 800);

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
                // Lança P1 com alta velocidade na direção do vetor até colidir com a parede
                this.aplicarKnockback(p1, this.p2Facing, 900, -100);
            }
        });

        this.time.delayedCall(350, () => {
            updateLoop.destroy();
            hitbox.destroy();
            linhasGrid.destroy();
            texto.destroy();
            p2.isDashing = false;
            p2.isAttacking = false;
            p2.body.setVelocityX(0);
        });
    }

    especialDescartesFinal() {
    // Nível 2: Ut duo cogito, ergo ut duo existo (Clone duplo sobreposto)
    this.p2Energy = 0;
    this.atualizarHUD();

    const p2 = this.player2;
    const p1 = this.player1;
    p2.isDashing = true;
    p2.isAttacking = true;

    const texto = this.add.text(p2.x, p2.y - 80, 'UT DUO COGITO, ERGO UT DUO EXISTO!', { font: '18px Arial', fill: '#ff00ff', style: 'bold' }).setOrigin(0.5);

    // 1. Cálculo do Deslocamento para sobreposição parcial
    // Desloca um pouco para trás na direção oposta ao olhar e um pouco para cima/lado
    const offsetX = -this.p2Facing * 25; // 25px atrás (metade da largura do sprite de 50px)
    const offsetY = -20;                 // 20px acima (sobreposição parcial)

    // 2. Criar o Clone sobreposto à metade
    const clone = this.add.rectangle(p2.x + offsetX, p2.y + offsetY, 50, 100, 0xff00ff, 0.6);
    this.physics.add.existing(clone);
    clone.body.setAllowGravity(false);

    // Garante que o clone fique visualmente desenhado logo atrás do original
    clone.setDepth(p2.depth - 1);

    // 3. Movimento sincronizado do Original e do Clone durante o Dash
    const velocidadeDash = this.p2Facing * 750;
    p2.body.setVelocityX(velocidadeDash);
    clone.body.setVelocityX(velocidadeDash);

    let acertou = false;

    // Colisão para causar dano se qualquer um dos dois (ou a área de sobreposição) atingir o P1
    this.physics.add.overlap([p2, clone], p1, () => {
        if (!acertou) {
            acertou = true;
            this.causarDano(1, 35);
            this.aplicarKnockback(p1, this.p2Facing, 700, -300);
        }
    });

    // 4. Finalização do Golpe
    this.time.delayedCall(400, () => {
        clone.destroy();
        texto.destroy();
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
                this.aplicarKnockback(alvo, direcao, forcaH, 0);
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
    this.aplicarKnockback(alvo, direcaoKnockback, 350, 0);
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