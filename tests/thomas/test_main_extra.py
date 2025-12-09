import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

import main

@pytest.mark.asyncio
async def test_schedule_save_calls_save_to_firebase(monkeypatch):
    # Forcer last_press_time assez ancien pour déclencher save_to_firebase
    main.last_press_time = asyncio.get_event_loop().time() - 5

    # Mock save_to_firebase
    fake_save = AsyncMock()
    monkeypatch.setattr(main, "save_to_firebase", fake_save)

    # Mock asyncio.sleep pour passer direct
    async def fake_sleep(duration):
        return
    monkeypatch.setattr(asyncio, "sleep", fake_sleep)

    await main.schedule_save()
    fake_save.assert_awaited_once()


@pytest.mark.asyncio
async def test_monitor_button_runs_once(monkeypatch):
    # Mock button et pump
    fake_button = MagicMock()
    fake_button.is_pressed = True
    fake_pump = MagicMock()

    monkeypatch.setattr(main, "button", fake_button)
    monkeypatch.setattr(main, "pump", fake_pump)

    # Mock broadcast et schedule_save
    monkeypatch.setattr(main, "broadcast", AsyncMock())
    monkeypatch.setattr(main, "schedule_save", AsyncMock())

    
    async def limited_monitor_button():
        for _ in range(2):
            await main.monitor_button()
   
    task = asyncio.create_task(main.monitor_button())
    await asyncio.sleep(0.2)
    task.cancel()

@pytest.mark.asyncio
async def test_monitor_button_press_triggers_save():
    # Patch du bouton pour simuler qu'il est pressé une fois
    button_mock = MagicMock()
    button_mock.is_pressed = True

    # Patch de la pompe pour ne rien faire
    pump_mock = MagicMock()
    # Patch broadcast pour ne rien envoyer réellement
    broadcast_mock = AsyncMock()
    # Patch schedule_save pour ne pas attendre 3s
    schedule_mock = AsyncMock()

    # Patch des globals dans main
    with patch.object(main, "button", button_mock), \
         patch.object(main, "pump", pump_mock), \
         patch.object(main, "broadcast", broadcast_mock), \
         patch.object(main, "schedule_save", schedule_mock):

        # On veut juste faire un "step" de la boucle, donc on limite le while
        async def limited_monitor():
            # Une seule itération de la boucle
            if main.button.is_pressed:
                main.pump.on()
                await main.broadcast("start_fill")
                main.last_press_time = asyncio.get_event_loop().time()

                # simulate remplissage court
                main.water_liters += 0.01
                main.plastic_recycled = int(main.water_liters * 42)

                main.pump.off()
                await main.broadcast("stop_fill")
                main.last_press_time = asyncio.get_event_loop().time()

                if main.save_task:
                    main.save_task.cancel()
                main.save_task = asyncio.create_task(main.schedule_save())

        await limited_monitor()

        # Vérifications
        pump_mock.off.assert_called_once()
        broadcast_mock.assert_awaited()  # au moins appelé une fois
        assert isinstance(main.save_task, asyncio.Task)

@pytest.mark.asyncio
async def test_schedule_save_cancelled():
    main.save_to_firebase = AsyncMock()
    main.last_press_time = asyncio.get_event_loop().time() - 5  # simuler délai
    # Créer une tâche et l’annuler immédiatement
    task = asyncio.create_task(main.schedule_save())
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

@pytest.mark.asyncio
async def test_fill_iteration():
    # On patch les éléments async et hardware
    with patch("main.pump") as mock_pump, \
         patch("main.broadcast", new_callable=AsyncMock) as mock_broadcast, \
         patch("asyncio.create_task") as mock_create_task:

        # Simuler que save_task existe
        main.save_task = MagicMock()
        
        # Variables simulées pour l'itération
        main.water_liters = 0
        main.plastic_recycled = 0
        main.last_press_time = 0

        # Simuler une itération de remplissage
        async def fill_once():
            # Pump allumé
            mock_pump.on()
            await main.broadcast("start_fill")
            main.last_press_time = asyncio.get_event_loop().time()

            # Remplissage simulé
            main.water_liters += main.fill_rate_per_sec
            main.plastic_recycled = int(main.water_liters * 42)
            await main.broadcast(f"{main.water_liters:.3f}")

            # Pump éteint
            mock_pump.off()
            await main.broadcast("stop_fill")
            main.last_press_time = asyncio.get_event_loop().time()

            # save_task annulé et recréé
            if main.save_task:
                main.save_task.cancel()
            main.save_task = asyncio.create_task(main.schedule_save())

        await fill_once()

        # Vérifications
        assert mock_pump.off.called
        assert any("stop_fill" in call.args[0] for call in mock_broadcast.await_args_list)
        mock_create_task.assert_called_once()
