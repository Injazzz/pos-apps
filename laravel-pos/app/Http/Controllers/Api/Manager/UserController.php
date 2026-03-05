<?php

namespace App\Http\Controllers\Api\Manager;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\User\CreateUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class UserController extends BaseApiController
{
    use AuthorizesRequests;

    public function __construct(
        private readonly UserService $userService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $users = $this->userService->getUsers($request->only([
            'role', 'status', 'search', 'per_page',
        ]));

        return $this->successResponse(
            UserResource::collection($users)->response()->getData(true),
            'Daftar user berhasil diambil.'
        );
    }

    public function store(CreateUserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $user = $this->userService->createUser($request->validated());

        return $this->createdResponse(
            new UserResource($user),
            'User berhasil dibuat.'
        );
    }

    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return $this->successResponse(
            new UserResource($user->load('customer')),
            'Detail user berhasil diambil.'
        );
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $updated = $this->userService->updateUser($user, $request->validated());

        return $this->successResponse(
            new UserResource($updated),
            'User berhasil diperbarui.'
        );
    }

    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $user->delete();

        return $this->noContentResponse('User berhasil dihapus.');
    }

    public function toggleStatus(User $user): JsonResponse
    {
        $this->authorize('toggleStatus', $user);

        $updated = $this->userService->toggleStatus($user);
        $status  = $updated->status === 'active' ? 'diaktifkan' : 'dinonaktifkan';

        return $this->successResponse(
            new UserResource($updated),
            "User berhasil {$status}."
        );
    }
}
