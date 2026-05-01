class Block extends Entity {
    constructor(x, y, options = {}) {
        super(x, y);
        this.id = generateEntityId('block');
        this.currentZoneId = options.currentZoneId || null;
        this.shadowOffset = 0;
        this.engagementDecayEnabled = false;
        this.renderWidth = options.renderWidth || gameConfig?.entities?.block?.renderWidth || 16;
        this.renderHeight = options.renderHeight || gameConfig?.entities?.block?.renderHeight || 16;
        this.blockHeight = options.blockHeight || 1;
        this.stackIndex = options.stackIndex || 0;
        this.supportBlockId = options.supportBlockId || null;
        this.lastPlacedMode = options.lastPlacedMode || 'ground';
        this.carriedById = options.carriedById || null;
        this.attachedOffset = {
            x: options.attachedOffset?.x ?? 0,
            y: options.attachedOffset?.y ?? -10
        };
        this.movedAtFrame = 0;
        this.lastMovedById = null;
        this.boardPos = options.boardPos || null;
        this.objectProfile = createObjectProfile({
            entityType: 'block',
            subtype: 'papilione-block',
            resourceTags: ['building', 'shelter', 'object-play'],
            carryable: true,
            consumable: false,
            occupancyState: 'normal',
            lifecycleStage: 'stable'
        });
        this.syncPlacementProfile();
        this.syncBoardPosFromScreen();
        this.syncDebugGridPos();
    }

    getBoardHeightForSort(anchor = null) {
        if (this.carriedById) {
            const zoneId = this.currentZoneId || gameCore?.getFocusedZoneId?.() || null;
            const hStep = (typeof zoneSystem !== 'undefined' ? zoneSystem?.getBoardConfigForZone?.(zoneId)?.hStep : null)
                || (typeof structureSystem !== 'undefined' ? structureSystem?.getCanonicalBlockUnit?.()?.visualLiftStep : null)
                || 8;
            return Math.max(0, (anchor?.zLift || 0) / Math.max(1, hStep));
        }
        return Math.max(0, this.stackIndex || 0);
    }

    syncBoardPosFromScreen(options = {}) {
        const zoneId = options.zoneId || this.currentZoneId || gameCore?.getFocusedZoneId?.() || null;
        const renderer = typeof renderManager !== 'undefined' ? renderManager : null;
        if (!zoneId || !renderer?.screenToBoard) return this.boardPos || null;
        const h = Number.isFinite(options.h)
            ? options.h
            : this.getBoardHeightForSort(options.anchor || null);
        const boardPos = renderer.screenToBoard(this.x || 0, this.y || 0, zoneId, this.carriedById ? h : 0);
        this.boardPos = {
            zoneId,
            u: boardPos.u,
            v: boardPos.v,
            h
        };
        return this.boardPos;
    }

    syncDebugGridPos() {
        if (typeof gridManager !== 'undefined' && gridManager?.screenToIso) {
            this.gridPos = gridManager.screenToIso(this.x || 0, this.y || 0);
        }
        return this.gridPos || null;
    }

    syncPlacementProfile(context = null) {
        const supportState = context?.supportState
            || (this.carriedById
                ? 'carried'
                : (this.stackIndex || 0) > 0
                    ? (this.supportBlockId ? 'supported' : 'unsupported')
                    : 'grounded');
        const occupancyState = supportState === 'carried'
            ? 'carried'
            : supportState === 'supported'
                ? 'stacked'
                : supportState === 'unsupported'
                    ? 'unstable'
                    : 'grounded';
        this.objectProfile.occupancyState = occupancyState;
        this.objectProfile.lifecycleStage = supportState === 'unsupported' ? 'unstable' : 'stable';
        return {
            supportState,
            occupancyState
        };
    }

    syncCarriedPose(carrier) {
        if (!carrier?.id) return null;
        const physicsSystem = gameCore?.physicsSystem;
        const physicsAnchor = physicsSystem?.initialized
            ? physicsSystem.applyCarriedBlockAnchor?.(carrier, this, physicsSystem.getEntityGroundPoint?.(carrier))
            : null;
        const anchor = physicsAnchor
            || structureSystem?.getCarryAnchorForEntity?.(carrier, this)
            || null;

        this.carriedById = carrier.id;
        this.currentZoneId = carrier.currentZoneId || this.currentZoneId;
        if (!anchor) return null;

        this.x = anchor.x;
        this.y = anchor.y;
        this.syncBoardPosFromScreen({ anchor });
        this.syncDebugGridPos();
        const renderer = typeof renderManager !== 'undefined' ? renderManager : null;
        this.zIndex = renderer?.computeRenderSortKey?.(this)
            ?? ((carrier.zIndex || 0) + (anchor.zLift ?? 18));
        this.syncPlacementProfile({ supportState: 'carried' });
        return anchor;
    }

    update(gameState) {
        const carrierId = this.carriedById || objectSystem?.getObjectState?.(this.id)?.carriedById || null;
        if (carrierId && Array.isArray(gameState?.butterflies)) {
            const carrier = gameState.butterflies.find(entry => entry.id === carrierId) || null;
            if (carrier) {
                this.syncCarriedPose(carrier);
                return;
            }
        }

        this.carriedById = null;
        this.updateZIndex();
        this.syncPlacementProfile();
    }

    updateZIndex() {
        const hasSnappedBoardCell = this.shouldSnapToCell()
            && !this.carriedById
            && this.boardPos
            && Number.isInteger(this.boardPos.u)
            && Number.isInteger(this.boardPos.v)
            && Number.isInteger(this.boardPos.h);
        if (!hasSnappedBoardCell && !this.snapToBoardCell({
            allowInvalidCell: true,
            reason: 'updateZIndex'
        })) {
            this.syncBoardPosFromScreen();
        }
        const renderer = typeof renderManager !== 'undefined' ? renderManager : null;
        if (this.boardPos && renderer?.computeRenderSortKey) {
            this.zIndex = renderer.computeRenderSortKey(this);
            return;
        }
        const baseGridY = this.gridPos?.y ?? 0;
        const baseGridX = this.gridPos?.x ?? 0;
        this.zIndex = (baseGridY * 1000) + baseGridX - 220 + (this.stackIndex * 24);
    }

    canBeMovedBy(butterfly) {
        if (!butterfly) return false;
        if (butterfly.state !== 'normal') return false;
        if (butterfly.isSpawning || butterfly.zoneTravel) return false;
        if (this.carriedById && this.carriedById !== butterfly.id) return false;
        if (structureSystem?.canCarryBlock && !structureSystem.canCarryBlock(this, butterfly, gameCore?.gameState)) {
            structureSystem.recordHeavyBlockCarryAttempt?.(this, butterfly, {
                gameState: gameCore?.gameState
            });
            return false;
        }
        return true;
    }

    getCurrentFrame() {
        return gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0);
    }

    shouldSnapToCell() {
        return structureSystem?.isBlockCellSnapEnabled?.() !== false;
    }

    getPlacementCellHeight() {
        return this.carriedById ? 0 : Math.max(0, Math.round(this.stackIndex || this.boardPos?.h || 0));
    }

    applyBoardCell(cell, options = {}) {
        if (!cell?.accepted && options.requireAccepted !== false) return false;
        const renderer = typeof renderManager !== 'undefined' ? renderManager : null;
        const zoneId = cell.zoneId || this.currentZoneId || null;
        const h = Math.max(0, Math.round(cell.h || 0));
        const screen = renderer?.boardToScreen?.({
            zoneId,
            u: cell.u,
            v: cell.v,
            h: 0
        }) || null;
        if (!screen) return false;

        this.currentZoneId = zoneId;
        this.boardPos = {
            zoneId,
            u: cell.u,
            v: cell.v,
            h
        };
        this.stackIndex = h;
        this.lastPlacedMode = h > 0 ? 'stacked' : 'ground';
        this.x = screen.x;
        this.y = screen.y;
        this.syncDebugGridPos();
        return true;
    }

    snapToBoardCell(options = {}) {
        if (!this.shouldSnapToCell() || this.carriedById) return false;
        const renderer = typeof renderManager !== 'undefined' ? renderManager : null;
        const zoneId = options.zoneId || this.currentZoneId || this.boardPos?.zoneId || gameCore?.getFocusedZoneId?.() || null;
        if (!zoneId || !renderer?.screenToBoard || !renderer?.boardToScreen || !structureSystem?.acceptCellPlacement) {
            return false;
        }

        const h = Number.isFinite(options.h) ? Math.max(0, Math.round(options.h)) : this.getPlacementCellHeight();
        const boardPoint = options.boardPos && Number.isFinite(options.boardPos.u) && Number.isFinite(options.boardPos.v)
            ? options.boardPos
            : renderer.screenToBoard(
                Number.isFinite(options.x) ? options.x : (this.x || 0),
                Number.isFinite(options.y) ? options.y : (this.y || 0),
                zoneId,
                0
            );
        const request = {
            zoneId,
            u: boardPoint.u,
            v: boardPoint.v,
            h,
            block: this,
            candidateBlocks: options.candidateBlocks || gameCore?.gameState?.blocks || null,
            ignoreBlockIds: [this.id].filter(Boolean),
            allowTrainingZoneBlocks: options.allowTrainingZoneBlocks === true
        };
        const accepted = options.allowInvalidCell
            ? structureSystem.acceptCellPlacement(request)
            : structureSystem.findNearestAcceptedCell?.(request, options.maxSearchRadius || 8);
        const cell = accepted?.accepted
            ? accepted
            : (options.allowInvalidCell
                ? {
                    accepted: true,
                    zoneId,
                    u: Math.round(boardPoint.u || 0),
                    v: Math.round(boardPoint.v || 0),
                    h
                }
                : null);
        if (!cell) {
            gameCore?.telemetrySystem?.recordRuntimeIssue?.('block-cell-placement-rejected', {
                blockId: this.id || null,
                zoneId,
                h,
                reason: accepted?.reason || 'no-legal-cell',
                source: options.reason || null
            });
            return false;
        }
        if (accepted && accepted.accepted === false) {
            gameCore?.telemetrySystem?.recordRuntimeIssue?.('block-cell-coerce', {
                blockId: this.id || null,
                zoneId,
                from: {
                    u: boardPoint.u,
                    v: boardPoint.v,
                    h
                },
                to: {
                    u: cell.u,
                    v: cell.v,
                    h: cell.h
                },
                reason: accepted.reason || null,
                source: options.reason || null
            });
        }
        return this.applyBoardCell(cell);
    }

    moveTo(x, y, movedById = null, options = {}) {
        const shouldClamp = options.clamp !== false;
        const clamped = shouldClamp
            ? (
                gameCore?.clampScreenPointToRoamArea?.(x, y, 8, {
                    zoneId: this.currentZoneId || null,
                    edgeInset: gameConfig?.entities?.placementEdgeInset || 0
                })
                || gridManager?.clampScreenPointToRoamArea?.(x, y, 8, {
                    edgeInset: gameConfig?.entities?.placementEdgeInset || 0
                })
                || { x, y }
            )
            : { x, y };
        this.x = clamped.x;
        this.y = clamped.y;
        this.syncDebugGridPos();
        if (!this.snapToBoardCell({
            x: this.x,
            y: this.y,
            h: options.h,
            candidateBlocks: options.candidateBlocks,
            allowTrainingZoneBlocks: options.allowTrainingZoneBlocks,
            allowInvalidCell: options.allowInvalidCell === true,
            reason: options.reason || 'moveTo'
        })) {
            this.syncBoardPosFromScreen();
        }
        this.updateZIndex();
        this.movedAtFrame = this.getCurrentFrame();
        this.lastMovedById = movedById || null;
        objectSystem?.recordInteraction?.(this.id, 'moved', movedById, {
            movedX: this.x,
            movedY: this.y
        });
        eventBus?.emit?.('object:moved', {
            objectId: this.id,
            sourceId: movedById,
            objectType: 'block',
            subtype: this.objectProfile?.subtype || 'papilione-block',
            x: this.x,
            y: this.y,
            zoneId: this.currentZoneId || null
        });
        return this;
    }

    pickupBy(butterfly) {
        if (!butterfly?.id) return false;
        const anchor = structureSystem?.getCarryAnchorForEntity?.(butterfly, this) || null;
        this.carriedById = butterfly.id;
        this.supportBlockId = null;
        this.lastPlacedMode = 'carried';
        this.stackIndex = 0;
        this.currentZoneId = butterfly.currentZoneId || this.currentZoneId;
        this.attachedOffset = {
            x: anchor ? anchor.x - (butterfly.x || 0) : (butterfly.sex === 'F' ? -7 : 7),
            y: anchor ? anchor.y - (butterfly.y || 0) : -10
        };
        this.syncCarriedPose(butterfly);
        return true;
    }

    placeAt(x, y, options = {}) {
        this.carriedById = null;
        this.stackIndex = options.stackIndex ?? 0;
        this.supportBlockId = options.supportBlockId || null;
        this.lastPlacedMode = options.placementMode || 'ground';
        this.currentZoneId = options.zoneId || this.currentZoneId;
        this.syncPlacementProfile({
            supportState: this.stackIndex > 0 ? 'supported' : 'grounded'
        });
        this.moveTo(x, y, options.movedById || null, {
            clamp: options.skipClamp === true
                ? false
                : this.lastPlacedMode !== 'stacked',
            h: this.stackIndex,
            candidateBlocks: options.candidateBlocks,
            allowInvalidCell: false,
            reason: 'placeAt'
        });
        objectSystem?.recordInteraction?.(this.id, this.lastPlacedMode === 'stacked' ? 'stacked' : 'placed', options.movedById || null, {
            placementMode: this.lastPlacedMode,
            supportBlockId: this.supportBlockId,
            stackIndex: this.stackIndex,
            zoneId: this.currentZoneId || null
        });
        eventBus?.emit?.('object:placed', {
            objectId: this.id,
            sourceId: options.movedById || null,
            objectType: 'block',
            subtype: this.objectProfile?.subtype || 'papilione-block',
            placementMode: this.lastPlacedMode,
            supportBlockId: this.supportBlockId,
            stackIndex: this.stackIndex,
            x: this.x,
            y: this.y,
            zoneId: this.currentZoneId || null
        });
        return this;
    }

    getVisualLift() {
        if (this.carriedById) return 0;
        const h = Number.isFinite(this.boardPos?.h)
            ? this.boardPos.h
            : Math.max(0, this.stackIndex || 0);
        const liftStep = (typeof zoneSystem !== 'undefined' ? zoneSystem?.getBoardConfigForZone?.(this.currentZoneId)?.hStep : null)
            || (typeof structureSystem !== 'undefined' ? structureSystem?.getCanonicalBlockUnit?.((this.stackIndex || 0) + 1)?.visualLiftStep : null)
            || Math.max(6, Math.round(this.renderHeight * 0.42));
        return h * liftStep;
    }

    drawShadow(graphics, alpha) {
        return;
    }

    getProceduralGeometry(drawY) {
        const snap = value => Math.round(value) + 0.5;
        const frontWidth = Math.max(12, Math.round(this.renderWidth * 0.62));
        const frontHeight = Math.max(12, Math.round(this.renderHeight * 0.62));
        const depthX = Math.max(4, Math.round(gameConfig?.entities?.block?.depthX || this.renderWidth * 0.34));
        const depthY = Math.max(3, Math.round(gameConfig?.entities?.block?.depthY || this.renderHeight * 0.22));
        const centerX = Math.round(this.x);
        const bottomY = Math.round(drawY);
        const left = snap(centerX - (frontWidth / 2));
        const right = snap(centerX + (frontWidth / 2));
        const top = snap(bottomY - frontHeight);
        const bottom = snap(bottomY);
        const backLeft = snap(left + depthX);
        const backRight = snap(right + depthX);
        const backTop = snap(top - depthY);
        const sideBottom = snap(bottom - depthY);
        return {
            left,
            right,
            top,
            bottom,
            backLeft,
            backRight,
            backTop,
            sideBottom
        };
    }

    drawProceduralCube(graphics, drawY, alpha) {
        const geometry = this.getProceduralGeometry(drawY);
        const outlineWeight = gameConfig?.entities?.block?.outlineWeight || 1.25;

        graphics.push();
        graphics.noStroke();
        graphics.fill(60, 234, 244, alpha);
        graphics.quad(
            geometry.left,
            geometry.top,
            geometry.right,
            geometry.top,
            geometry.right,
            geometry.bottom,
            geometry.left,
            geometry.bottom
        );

        graphics.fill(84, 244, 252, alpha);
        graphics.quad(
            geometry.left,
            geometry.top,
            geometry.right,
            geometry.top,
            geometry.backRight,
            geometry.backTop,
            geometry.backLeft,
            geometry.backTop
        );

        graphics.fill(32, 196, 210, alpha);
        graphics.quad(
            geometry.right,
            geometry.top,
            geometry.backRight,
            geometry.backTop,
            geometry.backRight,
            geometry.sideBottom,
            geometry.right,
            geometry.bottom
        );

        graphics.noFill();
        graphics.stroke(12, 18, 22, alpha);
        graphics.strokeWeight(outlineWeight);
        graphics.line(geometry.left, geometry.top, geometry.right, geometry.top);
        graphics.line(geometry.left, geometry.top, geometry.left, geometry.bottom);
        graphics.line(geometry.left, geometry.bottom, geometry.right, geometry.bottom);
        graphics.line(geometry.right, geometry.top, geometry.right, geometry.bottom);
        graphics.line(geometry.left, geometry.top, geometry.backLeft, geometry.backTop);
        graphics.line(geometry.backLeft, geometry.backTop, geometry.backRight, geometry.backTop);
        graphics.line(geometry.right, geometry.top, geometry.backRight, geometry.backTop);
        graphics.line(geometry.backRight, geometry.backTop, geometry.backRight, geometry.sideBottom);
        graphics.line(geometry.right, geometry.bottom, geometry.backRight, geometry.sideBottom);
        graphics.pop();
    }

    drawEntity(graphics, alpha) {
        const visualLift = this.getVisualLift();
        const drawY = this.y - visualLift;
        this.drawProceduralCube(graphics, drawY, alpha);
        if (this.movedAtFrame) {
            const movedFramesAgo = this.getCurrentFrame() - this.movedAtFrame;
            if (movedFramesAgo >= 0 && movedFramesAgo < 72) {
                const pulse = 1 - (movedFramesAgo / 72);
                graphics.push();
                graphics.noFill();
                graphics.stroke(255, 240, 170, 180 * pulse);
                graphics.strokeWeight(1.5);
                graphics.ellipse(this.x, drawY - (this.renderHeight * 0.18), this.renderWidth * 0.9, this.renderHeight * 0.38);
                graphics.pop();
            }
        }
    }
}
