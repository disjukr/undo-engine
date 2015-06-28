# 언두엔진

WIP

실행취소, 다시실행 기능을 간편하게 구현할 수 있도록 도와주는 라이브러리입니다.

사용 편의성, 메모리 점유, 연산량 등을 고려하여 여러 구현체 중 하나를 선택할 수 있는게 특징입니다.


## 기계 인터페이스

언두엔진은 우선 스냅샷을 얻어오고, 얻어온 스냅샷을 다시 적용할 수 있는 상태기계가 하나 존재한다고 가정합니다.
이 기계는 스냅샷을 떠내는 동안, 또는 적용하는 동안 상태가 변화돼선 안됩니다.

이 기계의 정의는 다음과 같습니다:

```typescript
interface Machine {
    takeSnapshot(part): any;
    applySnapshot(snapshot, part): void|Promise;
}
```

### `takeSnapshot`
기계의 스냅샷을 반환합니다.
반환되는 스냅샷은 기계가 받아서 스냅샷이 찍혔던 순간의 상태로 다시 되돌아갈 수만 있다면,
어떠한 자료형으로 되어있더라도(예: `undefined`) 상관이 없습니다.

인자로 들어오는 `part`는 기계의 부분을 특정하기 위한 값입니다.
예를 들어 라이브러리 사용자가 여러 레이어를 가진 드로잉 툴을 구현한다고 할 때,
라이브러리 사용자는 드로잉 명령이 하나 처리된다고 해서
문서의 모든 레이어를 아우르는 스냅샷이 떠지게 만들고 싶지는 않을 것입니다.
이런 경우, 엔진은 `takeSnapshot`의 `part`인자로
드로잉 명령이 영향을 끼친 레이어의 스냅샷만 특정하도록 도와줍니다.

기계(드로잉 툴)는 `takeSnapshot`을 구현할 때,
`part`인자가 `undefined` 값으로 들어오면 문서의 전체 스냅샷을 떠서 반환하면 됩니다.
`undefined` 값이 아니면 `part`가 특정하는 기계의 부분 스냅샷을 반환하면 됩니다.

`takeSnapshot`이 비동기로 처리된다면 `resolve`에 스냅샷을 인자로 넣어주는 Promise 객체를 반환하면 됩니다.

### `applySnapshot`
기계에 스냅샷을 적용합니다.
`takeSnapshot`에서 반환된 값이 그대로 `snapshot` 인자로 들어옵니다.
`part`인자가 `undefined` 값으로 들어오면 `snapshot` 인자를 문서 전체에 대해서 적용하면 됩니다.
`undefined` 값이 아니면 `part`가 특정하는 기계의 부분에 `snapshot` 인자를 적용하면 됩니다.

비동기로 처리될 경우 Promise 객체를 반환하면 됩니다.


## 엔진 인터페이스

언두엔진은 기계의 상태가 변하는 매 순간에 대해 스냅샷을 떠내지 않습니다.
대신 순간순간 실행한 명령을 기억하며, 실행취소 시에 가장 가까운 스냅샷으로 기계의 상태를 되돌린 후,
스냅샷 이후 실행됐던 명령 중 실행취소된 명령을 제외한 나머지 명령들을 복기하여 상태를 되돌립니다.

엔진의 정의는 다음과 같습니다:

```typescript
interface Engine {
    do(action: Function, rollback?: Function, amend?: boolean, user?, parts: any[]): Promise;
    undo(user?): Promise;
    redo(user?): Promise;
}
```
