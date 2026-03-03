"""Unit tests for decay service.

This module contains isolated unit tests for DecayService,
with all external dependencies mocked.
"""

import unittest
from unittest.mock import patch, Mock
from services.decay_service import DecayService


class TestDecayService(unittest.IsolatedAsyncioTestCase):
    """Tests for DecayService."""

    async def test_run_decay_loop_success_iteration(self):
        """Test run_decay_loop applies decay and sleeps for configured interval."""
        service = DecayService(decay_rate_minutes=2)

        with patch("services.decay_service.TreeService.apply_decay_to_all", side_effect=[3, KeyboardInterrupt("stop")]) as mock_apply, \
             patch("services.decay_service.asyncio.sleep", return_value=None) as mock_sleep:
            with self.assertRaises(KeyboardInterrupt):
                await service.run_decay_loop()

        self.assertEqual(mock_apply.call_count, 2)
        mock_sleep.assert_called_once_with(120)

    async def test_run_decay_loop_error_path_uses_retry_sleep(self):
        """Test run_decay_loop sleeps 60s after an error and retries."""
        service = DecayService(decay_rate_minutes=1)

        with patch("services.decay_service.TreeService.apply_decay_to_all", side_effect=Exception("db error")) as mock_apply, \
             patch("services.decay_service.asyncio.sleep", side_effect=[Exception("stop")]) as mock_sleep:
            with self.assertRaises(Exception):
                await service.run_decay_loop()

        mock_apply.assert_called_once_with()
        mock_sleep.assert_called_once_with(60)

    @patch("services.decay_service.asyncio.create_task")
    def test_start_creates_task_when_none(self, mock_create_task):
        """Test start creates a new background task when absent."""
        service = DecayService(decay_rate_minutes=1)
        task = Mock()
        task.done.return_value = False

        def create_task_side_effect(coro):
            coro.close()
            return task

        mock_create_task.side_effect = create_task_side_effect

        service.start()

        mock_create_task.assert_called_once()
        self.assertIs(service.task, task)

    @patch("services.decay_service.asyncio.create_task")
    def test_start_creates_new_task_when_previous_done(self, mock_create_task):
        """Test start replaces completed task."""
        service = DecayService(decay_rate_minutes=1)
        old_task = Mock()
        old_task.done.return_value = True
        service.task = old_task

        new_task = Mock()
        new_task.done.return_value = False

        def create_task_side_effect(coro):
            coro.close()
            return new_task

        mock_create_task.side_effect = create_task_side_effect

        service.start()

        mock_create_task.assert_called_once()
        self.assertIs(service.task, new_task)

    @patch("services.decay_service.asyncio.create_task")
    def test_start_does_not_create_when_task_running(self, mock_create_task):
        """Test start does nothing if task is still running."""
        service = DecayService(decay_rate_minutes=1)
        running_task = Mock()
        running_task.done.return_value = False
        service.task = running_task

        service.start()

        mock_create_task.assert_not_called()
        self.assertIs(service.task, running_task)

    def test_stop_cancels_running_task(self):
        """Test stop cancels active task."""
        service = DecayService(decay_rate_minutes=1)
        running_task = Mock()
        running_task.done.return_value = False
        service.task = running_task

        service.stop()

        running_task.cancel.assert_called_once_with()

    def test_stop_does_nothing_for_done_task(self):
        """Test stop does not cancel already completed task."""
        service = DecayService(decay_rate_minutes=1)
        done_task = Mock()
        done_task.done.return_value = True
        service.task = done_task

        service.stop()

        done_task.cancel.assert_not_called()


if __name__ == "__main__":
    unittest.main()
