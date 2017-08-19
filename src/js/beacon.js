class Beacon {

    constructor() {
        // Get rid of those if theyre set externally
        this.x = 0;
        this.y = 0;

        this.team = ENEMY_TEAM;
        this.teamOwnedFactor = 0;
        this.conqueringTeam = null;
        this.conqueringOwnedFactor = 0;

        this.enemyTeamOwned = 1;
        this.playerTeamOwned = 0;

        this.nextParticle = 0;
    }

    cycle(e) {
        const units = W.units.filter(u => dist(u, this) < BEACON_CONQUER_RADIUS);
        const player = units.filter(unit => unit.team == PLAYER_TEAM);
        const enemy = units.filter(unit => unit.team == ENEMY_TEAM);

        let actualConqueringTeam;
        if (enemy.length > player.length) {
            actualConqueringTeam = ENEMY_TEAM;
        } else if (enemy.length < player.length) {
            actualConqueringTeam = PLAYER_TEAM;
        }

        this.nextParticle -= e;
        if (this.nextParticle < 0 && actualConqueringTeam) {
            this.nextParticle = 0.2;

            const unit = pick(actualConqueringTeam == ENEMY_TEAM ? enemy : player);
            const t = rand(0.5, 1.5);
            particle(5, actualConqueringTeam.body, [
                ['x', unit.x, this.x, t, 0],
                ['y', unit.y, this.y, t, 0],
                ['s', 0, rand(5, 10), t]
            ]);
        }

        let playerOwnedSign = 0;
        let enemyOwnedSign = 0;
        if (actualConqueringTeam == ENEMY_TEAM) {
            playerOwnedSign = -1;
            enemyOwnedSign = this.playerTeamOwned > 0 ? 0 : 1;
        } else if (actualConqueringTeam == PLAYER_TEAM) {
            enemyOwnedSign = -1;
            playerOwnedSign = this.enemyTeamOwned > 0 ? 0 : 1;
        } else if (units.length == 0) {
            playerOwnedSign = this.team == PLAYER_TEAM ? 1 : -1;
            enemyOwnedSign = this.team == ENEMY_TEAM ? 1 : -1;
            // Otherwise, it means we have a tie, so let's not move ownership at all
        }

        const factor = BEACON_CONQUER_SPEED_PER_UNIT * max(1, abs(player.length - enemy.length));

        this.playerTeamOwned = max(0, min(1, this.playerTeamOwned + playerOwnedSign * factor * e));
        this.enemyTeamOwned = max(0, min(1, this.enemyTeamOwned + enemyOwnedSign * factor * e));

        let newOwner;
        if (this.playerTeamOwned == 1) {
            newOwner = PLAYER_TEAM;
        } else if (this.enemyTeamOwned == 1) {
            newOwner = ENEMY_TEAM;
        } else if (!this.playerTeamOwned && !this.enemyTeamOwned) {
            newOwner = NEUTRAL_TEAM;
        }

        if (newOwner && newOwner != this.team) {
            this.team = newOwner;

            for (let i = 0 ; i < 100 ; i++) {
                const angle = rand(0, PI * 2);
                const dist = rand(100, 200);
                const t = rand(0.5, 1.5);
                particle(5, newOwner.body, [
                    ['x', this.x, this.x + cos(angle) * dist, t, 0, easeOutQuad],
                    ['y', this.y, this.y + sin(angle) * dist, t, 0, easeOutQuad],
                    ['s', rand(5, 10), 0, t]
                ]);
            }
        }
    }

    render() {
        wrap(() => {
            translate(this.x, this.y);

            const s = (G.t % BEACON_CENTER_PERIOD) / BEACON_CENTER_PERIOD;

            R.fillStyle = R.strokeStyle = this.team.head;
            beginPath();
            arc(0, 0, BEACON_CENTER_RADIUS * s, 0, PI * 2, true);
            fill();

            R.globalAlpha = 1 - s;
            beginPath();
            arc(0, 0, BEACON_CENTER_RADIUS, 0, PI * 2, true);
            fill();

            R.globalAlpha = 0.5;

            [
                -G.t * PI * 2,
                -G.t * PI * 2 + PI
            ].forEach(angle => this.drawArc(angle, BEACON_ARC_RADIUS));

            [
                G.t * PI * 3,
                G.t * PI * 3 + PI
            ].forEach(angle => this.drawArc(angle, BEACON_ARC_RADIUS + 2));

            const s2 =  (G.t % BEACON_WAVE_PERIOD) / BEACON_WAVE_PERIOD;
            R.lineWidth = 2;
            R.globalAlpha = s2;
            beginPath();
            arc(0, 0, 80 * (1 - s2), 0, PI * 2, true);
            stroke();
        });
    }

    postRender() {
        translate(this.x, this.y);

        R.fillStyle = '#000';
        fillRect(
            evaluate(-BEACON_GAUGE_WIDTH / 2) - 1,
            -BEACON_GAUGE_RADIUS - 1,
            evaluate(BEACON_GAUGE_WIDTH + 2),
            evaluate(BEACON_GAUGE_HEIGHT + 2)
        );

        R.fillStyle = '#0f0';
        fillRect(
            evaluate(-BEACON_GAUGE_WIDTH / 2) * this.playerTeamOwned,
            -BEACON_GAUGE_RADIUS,
            BEACON_GAUGE_WIDTH * this.playerTeamOwned,
            BEACON_GAUGE_HEIGHT
        );

        R.fillStyle = '#f00';
        fillRect(
            evaluate(-BEACON_GAUGE_WIDTH / 2) * this.enemyTeamOwned,
            -BEACON_GAUGE_RADIUS,
            BEACON_GAUGE_WIDTH * this.enemyTeamOwned,
            BEACON_GAUGE_HEIGHT
        );

        if (DEBUG) {
            fillText(roundP(this.playerTeamOwned, 0.1) + ' - ' + roundP(this.enemyTeamOwned, 0.1) + ':' + this.enemyTeamOwned, 0, 50);
        }
    }

    drawArc(angle, radius) {
        wrap(() => {
            rotate(angle);

            beginPath();
            arc(0, 0, radius, 0, PI / 3, false);
            stroke();
        });
    }

}