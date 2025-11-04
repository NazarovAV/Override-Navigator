"""
Второй файл для тестирования навигации между файлами
"""

from test_inheritance import Animal, Dog


class Robot:
    """Базовый класс робота"""

    def __init__(self, model):
        self.model = model

    def power_on(self):
        """Включение робота"""
        return f"{self.model} is powering on"

    def execute_task(self):
        """Выполнение задачи"""
        raise NotImplementedError("Subclass must implement")


class CleaningRobot(Robot):
    """Робот-уборщик"""

    def execute_task(self):
        """Переопределенный метод для робота-уборщика"""
        return f"{self.model} is cleaning"

    def vacuum(self):
        """Уникальный метод"""
        return f"{self.model} is vacuuming"


class SecurityRobot(Robot):
    """Робот-охранник"""

    def execute_task(self):
        """Переопределенный метод для робота-охранника"""
        return f"{self.model} is patrolling"

    def scan_area(self):
        """Уникальный метод"""
        return f"{self.model} is scanning the area"


# Пример наследования из другого файла
class RoboDog(Dog, Robot):
    """Робо-пес - множественное наследование"""

    def __init__(self, name, model):
        Dog.__init__(self, name)
        Robot.__init__(self, model)

    def speak(self):
        """Переопределенный метод"""
        return f"{self.name} ({self.model}) says Beep-Woof!"

    def execute_task(self):
        """Переопределенный метод"""
        return f"{self.name} is executing: patrol and play"


if __name__ == "__main__":
    cleaning = CleaningRobot("RoombaX1000")
    security = SecurityRobot("GuardBot2000")
    robo_dog = RoboDog("RoboBuddy", "K9-3000")

    print(cleaning.execute_task())
    print(security.execute_task())
    print(robo_dog.speak())
    print(robo_dog.execute_task())
