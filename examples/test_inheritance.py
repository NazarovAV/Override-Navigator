"""
Пример для тестирования расширения Python Class Navigator
"""


class Common:
    """Базовый класс для всех классов"""

    def __init__(self, name):
        self.name = name


class Animal(Common):
    """Базовый класс животного"""

    def __init__(self, name):
        self.name = name

    def speak(self):
        """Метод, который будет переопределен в дочерних классах"""
        raise NotImplementedError("Subclass must implement abstract method")

    def sleep(self):
        """Общий метод для всех животных"""
        print(f"{self.name} is sleeping")


class Dog(Animal):
    """Класс собаки, наследуется от Animal"""

    def speak(self):
        """Переопределенный метод для собаки"""
        return f"{self.name} says Woof!"

    def fetch(self):
        """Уникальный метод для собаки"""
        return f"{self.name} is fetching the ball"

    def bark(self):
        """Уникальный метод для собаки"""
        return f"{self.name} is barking"


class Cat(Animal):
    """Класс кошки, наследуется от Animal"""

    def speak(self):
        """Переопределенный метод для кошки"""
        return f"{self.name} says Meow!"

    def climb(self):
        """Уникальный метод для кошки"""
        return f"{self.name} is climbing a tree"


class Bird(Animal):
    """Класс птицы, наследуется от Animal"""

    def speak(self):
        """Переопределенный метод для птицы"""
        return f"{self.name} says Tweet!"

    def fly(self):
        """Уникальный метод для птицы"""
        return f"{self.name} is flying"


class GoldenRetriever(Dog):
    """Класс золотистого ретривера, наследуется от Dog"""

    def speak(self):
        """Переопределенный метод для золотистого ретривера"""
        return f"{self.name} says Woof! Woof! (friendly golden retriever)"

    def swim(self):
        """Уникальный метод для золотистого ретривера"""
        return f"{self.name} loves swimming"

    def bark(self):
        return "some method"


class PersianCat(Cat):
    """Класс персидской кошки, наследуется от Cat"""

    def speak(self):
        """Переопределенный метод для персидской кошки"""
        return f"{self.name} says Meow~ (elegant persian cat)"


# Пример множественного наследования
class Platypus(Animal):
    """Класс утконоса - уникальное животное"""

    def speak(self):
        return f"{self.name} says... something?"

    def swim(self):
        return f"{self.name} is swimming"

    def lay_eggs(self):
        return f"{self.name} is laying eggs"


if __name__ == "__main__":
    # Создание экземпляров
    dog = Dog("Buddy")
    cat = Cat("Whiskers")
    bird = Bird("Tweety")
    golden = GoldenRetriever("Max")
    persian = PersianCat("Princess")

    # Тестирование методов
    print(dog.speak())
    print(cat.speak())
    print(bird.speak())
    print(golden.speak())
    print(persian.speak())

    # Общий метод
    dog.sleep()
    cat.sleep()
